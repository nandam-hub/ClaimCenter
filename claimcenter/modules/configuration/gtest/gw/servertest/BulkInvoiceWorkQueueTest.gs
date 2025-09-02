package gw.servertest

uses gw.api.databuilder.BulkInvoiceBuilder
uses gw.api.databuilder.BulkInvoiceItemBuilder
uses gw.api.databuilder.ClaimBuilder
uses gw.api.financials.BulkInvoiceUIHelper
uses gw.api.test.CCServerTestClassBase
uses gw.api.util.CCCurrencyUtil
uses gw.api.util.CurrencyUtil
uses gw.sampledata.SampleDataGroup
uses gw.suites.CCExampleServerSuite
uses gw.testharness.v3.Suites
uses gw.workqueue.WorkQueueTestUtil

@Export
@Suites(CCExampleServerSuite.NAME)
class BulkInvoiceWorkQueueTest extends CCServerTestClassBase {

  override function beforeClass() {
    try {
      gw.transaction.Transaction.runWithNewBundle(\bundle -> {
        SampleDataGroup.Admin.load()
      }, "su")
    } catch (e) {
      e.printStackTrace()
    }
  }

  function testBulkInvoiceWorkQueue() {
    // Create a submitted for approval BulkInvoice with an approved item
    var invoice = createBulkInvoice("aapplegate")
    assertBulkInvoiceStatuses(invoice, BulkInvoiceStatus.TC_INITIATINGCHECKCREATION, BulkInvoiceItemStatus.TC_APPROVED)
    // A work item to process the BulkInvoice should exist
    assertWorkQueueItems(1, 0)

    processWorkQueueItems(BatchProcessType.TC_INVOICEPROCESSING)
    // BulkInvoice should be "Creating checks"
    assertBulkInvoiceStatuses(invoice, BulkInvoiceStatus.TC_CREATINGCHECKS, BulkInvoiceItemStatus.TC_APPROVED)
    // A work item to process the BulkInvoiceItem should exist
    assertWorkQueueItems(0, 1)

    processWorkQueueItems(BatchProcessType.TC_INVOICEITEMPROCESSING)
    // BulkInvoice and BulkInvoiceItem should be "Awaiting submission"
    assertBulkInvoiceStatuses(invoice, BulkInvoiceStatus.TC_AWAITINGSUBMISSION, BulkInvoiceItemStatus.TC_AWAITINGSUBMISSION)
    assertWorkQueueItems(0, 0)
    assertClaimOnInvoicesHaveChecks(invoice)
  }

  function createBulkInvoice(authorisedUser : String) : BulkInvoice {
    var invoice : BulkInvoice
    gw.transaction.Transaction.runWithNewBundle(\bundle -> {
      invoice = BulkInvoiceBuilder.uiReadyBulkInvoice()
          .asValid()
          .withItem(new BulkInvoiceItemBuilder()
              .withClaim(ClaimBuilder.uiReadyAuto().atAbilityToPay())
              .withCostType(CostType.TC_CLAIMCOST)
              .withCostCategory(CostCategory.TC_LEGAL)
              .withPaymentType(PaymentType.TC_FINAL)
              .withReservingCurrency(CurrencyUtil.DefaultCurrency)
              .withAmount(CCCurrencyUtil.get(10bd, CurrencyUtil.DefaultCurrency))
              .withStatus(BulkInvoiceItemStatus.TC_APPROVED)
              .asAwaitingProcessing())
          .create(bundle)

      invoice.validate()
      assertThat(invoice.isValid())
          .as("Expected the invoice to be valid. Validation Alerts: ${invoice.ValidationAlerts.join(", ")}")
          .isTrue()
      assertThat(invoice.InvoiceItems.single().validateForSubmission())
          .as("The InvoiceItem should be valid for submission. " +
              "Explaination: ${invoice.InvoiceItems.single().Explanation}")
          .isTrue()

      BulkInvoiceUIHelper.beforeSubmit(invoice)
      invoice.submitForApproval()

    }, authorisedUser)
    Logger.info("Created Bulk Invoice (#${invoice.InvoiceNumber}) " +
      "with InvoiceItem on Claim #${invoice.InvoiceItems.single().ClaimNumber}")
    return invoice
  }

  function assertBulkInvoiceStatuses(invoice : BulkInvoice, invoiceStatus : BulkInvoiceStatus, itemStatus : BulkInvoiceItemStatus) {
    assertThat((invoice.refresh() as BulkInvoice).Status)
        .as("Invoice #${invoice.InvoiceNumber} had unexpected status.")
        .isEqualTo(invoiceStatus)
    var item = invoice.InvoiceItems.single().refresh() as BulkInvoiceItem
    assertThat(item.Status)
          .as("Invoice Item for Claim ${item.ClaimNumber} on Invoice #${invoice.InvoiceNumber} had unexpected status.")
          .isEqualTo(itemStatus)
  }

  function assertWorkQueueItems(numOfInvoices : int, numOfItems : int) {
    assertThat(getNumItemsInQueue(BatchProcessType.TC_INVOICEPROCESSING))
        .as("${BatchProcessType.TC_INVOICEPROCESSING} had an unexpected number of work queue items.")
        .isEqualTo(numOfInvoices)
    assertThat(getNumItemsInQueue(BatchProcessType.TC_INVOICEITEMPROCESSING))
        .as("Expected ${BatchProcessType.TC_INVOICEITEMPROCESSING} had an unexpected number of work queue items.")
        .isEqualTo(numOfItems)
  }

  function assertClaimOnInvoicesHaveChecks(invoice : BulkInvoice) {
    var item = invoice.InvoiceItems.single()
    var checks = item.Claim.ChecksQuery.toTypedArray()
    assertThat(checks).as("The claim should have a single check.").hasSize(1)
    assertThat(checks.single().BulkInvoiceItem).as("The check should be associated with the invoice item")
        .isEqualTo(item)
  }

  function processWorkQueueItems(batch : BatchProcessType) {
    WorkQueueTestUtil.restartWorkersAndWaitUntilWorkFinishedThenStop(batch)
  }

  function getNumItemsInQueue(batch : BatchProcessType) : int {
    return WorkQueueTestUtil.getNumItemsInQueue(batch)
  }

}
