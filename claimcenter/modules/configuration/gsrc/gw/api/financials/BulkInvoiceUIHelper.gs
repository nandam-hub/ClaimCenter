package gw.api.financials

uses gw.api.database.IQueryBeanResult
uses gw.api.database.Relop
uses gw.api.filters.StandardQueryFilter
uses gw.api.filters.TypeKeyFilterSet
uses gw.util.GosuStringUtil

/**
 * This class provides helpful methods for all the pages related to BulkInvoice.
 */
@Export
class BulkInvoiceUIHelper {

  /**
   * Manages the Bulk Invoice submission process in the UI.  Used exclusively by EditBulkInvoiceDetail.pcf.
   *
   * @param helper used within the context of the UI
   * @param bulkInvoice bulk invoice to process
   */
  public static function validateAndSubmit(helper : BulkPayHelper, bulkInvoice : BulkInvoice) {
    if (bulkInvoice.Validateable) {
      helper.validateBulkInvoice(bulkInvoice)
      bulkInvoice.refresh()
    }

    if (bulkInvoice.Submittable) {
      BulkInvoiceUIHelper.beforeSubmit(bulkInvoice)
      helper.submitBulkInvoiceForApprovalAndCommit(bulkInvoice)
      bulkInvoice.refresh()
    }
  }

  /**
   * Initiates retryProcessing on the supplied bundle, committing the resulting work items.
   * @param bulkInvoice
   */
  public static function retryProcessing(bulkInvoice : BulkInvoice) {
    gw.transaction.Transaction.runWithNewBundle(\bundle -> bundle.add(bulkInvoice).retryProcessing())
  }

  /**
   * Updates backing data after an invoice item has been modified in the UI.  This is exclusively used by
   * BulkInvoiceItemsLV.pcf.
   * @param helper BulkPayHelper used within the context of the UI
   * @param invoiceItem item currently being edited in the UI
   */
  public static function updateInvoiceItem(helper : BulkPayHelper, invoiceItem : BulkInvoiceItem) {
    helper.cleanupClaim(invoiceItem)
    invoiceItem.setClaimByClaimNumber(invoiceItem.ClaimNumber)
  }

  /**
   * Finds all Bulk Invoice Items associated with a given Bulk Invoice, in sorted order.  Optionally allows additional
   * filtering based on Claim Number. This query processor is used exclusively by BulkInvoiceItemsLV.pcf.
   *
   * @param bulkInvoice Bulk Invoice to apply claim filtering
   * @param claimNumberFilter optional claim number used to filter bulk invoice items. Null if no claim filtering to be applied.
   * @return sorted Bulk Invoice Item query with claim filtering potentially applied
   */
  public static function getSortedBulkInvoiceItemQuery(bulkInvoice : BulkInvoice, claimNumberFilter : String) : IQueryBeanResult<BulkInvoiceItem> {
    // get the base query
    var query = bulkInvoice.getSortedInvoiceItemsQuery()

    // if user has set a valid claim number, then apply filter to processor
    // this assumes that checks have been made at the UI level to validate the given claim number is valid
    if (GosuStringUtil.isNotBlank(claimNumberFilter)) {
      query.addPersistentFilter(new StandardQueryFilter(claimNumberFilter,
          \q -> q.compare(BulkInvoiceItem#ClaimNumber, Relop.Equals, claimNumberFilter)))
    }
    return query
  }

  /**
   * Set of query filters used exclusively by BulkInvoiceItemsLV.pcf to filter displayed content.
   */
  public static property get BulkInvoiceItemFilterSet() : StandardQueryFilter[] {
    return new TypeKeyFilterSet(BulkInvoiceItem.STATUS_PROP.get()).getFilterOptions(BulkInvoiceItemStatus.TF_BULKINVOICEITEMFILTERSET.getTypeKeys(), false)
  }

  /**
   * Callback that gets invoked just before submitting a BulkInvoice. This OOTB implementation updates the RequestingUser
   * of the BulkInvoice to the currently logged in user, if they are determined to be different. This is to handle the
   * cases where one user creates the BulkInvoice and another one (say, an admin) submits it.
   */
  static function beforeSubmit(bulkInvoice : BulkInvoice) {
    var currentUser = User.util.CurrentUser
    if (currentUser != bulkInvoice.RequestingUser) {
      gw.transaction.Transaction.runWithNewBundle(\bundle -> {
        bundle.add(bulkInvoice).RequestingUser = currentUser
      })
    }
  }

}