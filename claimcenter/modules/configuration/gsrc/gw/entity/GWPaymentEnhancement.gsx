package gw.entity

uses gw.api.financials.CurrencyAmount
uses gw.api.locale.DisplayKey
uses gw.api.financials.FinancialsUtil
uses gw.api.util.CurrencyUtil
uses gw.api.util.DisplayableException

uses java.math.BigDecimal

@Export
enhancement GWPaymentEnhancement : Payment {

  /**
   * Returns true if this payment contains a line item associated with a deductible,
   * false otherwise.
   */
  public function hasDeductibleLineItem() : Boolean {
    return this.LineItems.hasMatch(\ t -> t.LineCategory == LineCategory.TC_DEDUCTIBLE)
  }

  /**
   * Returns the first deductible line item on this payment, if any.
   * There should not be more than one deductible line item on a payment;
   * if there is, the line item returned by this method is undetermined.
   *
   * @return deductible line item on this payment, or null if there is none
   */
  public property get DeductibleLineItem() : TransactionLineItem {
    return this.LineItems.firstWhere(\tli -> tli.LineCategory == LineCategory.TC_DEDUCTIBLE)
  }

  /**
   * Returns true if this payment has a line item with former deductible line
   * category, false otherwise
   */
  public function hasFormerDeductibleLineItem() : boolean {
    return this.LineItems.hasMatch( \ t -> t.LineCategory == LineCategory.TC_FORMERDEDUCTIBLE )
  }

  /**
   * Returns this payment's exposure's coverage's deductible
   * (which will be identical for all payments that have the same exposure)
   * if it exists. Note that the deductible returned, if paid,
   * may not necessarily be paid by this payment. The returned value may be null.
   */
  property get SharedDeductible() : Deductible {
    return this.Exposure.Coverage.ClaimDeductible
  }

  /**
   * Applies a deductible to the this payment. If the payment's exposure's coverage has no deductible,
   * or if the deductible has already been paid, this method throws an exception. Otherwise,
   * a new line item in the negative amount of the deductible and with line category "deductible"
   * is created and added to the payment. Returns the newly created line item.
   */
  function addDeductibleLineItem() : TransactionLineItem {
    if (hasDeductibleLineItem()) {
      throw new DisplayableException(DisplayKey.get("Deductible.Error.DeductibleTLIAlreadyExists"))
    }
    if (SharedDeductible == null) {
      throw new DisplayableException(DisplayKey.get("Deductible.Error.NoApplicableDeductible"))
    }
    if (!SharedDeductible.HasRemainingAmount) {
      throw new DisplayableException(DisplayKey.get("Deductible.Error.DeductibleAlreadyPaid"))
    }

    // if there exists a single line item that has a null transaction amount, reuse as the deductible line item
    var tli : TransactionLineItem
    if (this.LineItems.length == 1) {
      tli = this.LineItems.firstWhere(\lineItem -> lineItem.isNew() and lineItem.TransactionAmount == null)
    }

    tli = tli ?: new TransactionLineItem()
    tli.LineCategory = TC_DEDUCTIBLE
    this.addToLineItems(tli)

    // sum accross all line items of the transaction
    var originalTransactionAmount = this.TransactionAmount

    // positive - deductible, negative - refund
    var amountRemaining = SharedDeductible.AmountRemaining_Core

    // apply the deductible (this call will convert the currency)
    tli.setAmountMatchingCurrency(-amountRemaining)

    // if the converted deductible exceeds the payments then only apply enough to make it zero
    if (amountRemaining.Amount > 0 && originalTransactionAmount.Amount > 0 and -tli.TransactionAmount > originalTransactionAmount) {
      tli.setAmountMatchingCurrency(-originalTransactionAmount)
    }

    SharedDeductible.linkItem_Core(tli)

    return tli
  }

  /**
   * Unlinks a deductible entity from a transaction line item on this payment, if one exists.
   * This does NOT remove the line item from the payment.
   */
  public function unlinkDeductible() {
    if (!hasDeductibleLineItem()) {
      throw new DisplayableException(DisplayKey.get("Deductible.Error.NoDeductibleToUnlinkFromPayment"))
    }
    DeductibleLineItem.unlink()
  }

  /**
   * Unlinks the given deductible entity from a transaction line item on this payment, if one exists.
   * Removes that line item from this payment. If the given deductible is null, or its linked
   * transaction line item does not belong to this payment, this method does nothing.
   */
  public function unapplyAndRemoveDeductibleLineItem(d : Deductible) {
    if (d == null) {
      return
    }
    var tli = DeductibleLineItem
    if (tli == null) {
      return
    }
    tli.unlink()
    this.removeFromLineItemsIfEditable(tli)
  }

  /**
   * Unlinks the deductible pointing to the given line item. The given line item
   * must be a valid deductible line item, or an exception is thrown.
   * Removes the line item from this payment.
   */
  function removeDeductibleLineItem(tli : TransactionLineItem) {
    if (!tli.LinkedToDeductible) {
      throw new DisplayableException(DisplayKey.get("Deductible.Error.NonDeductibleTransactionLineItem"))
    }
    tli.unlink()
    this.removeFromLineItemsIfEditable(tli)
  }

  /**
   * Links deductible line items in preparation for a transfer or recode if necessary. This method examines the
   * potential deductible line items on this payment, i.e. line items that have a line category of "Deductible" but are
   * not linked to a Deductible. For each such line item, links it to a Deductible if:
   *
   *   - the deductible exists, is unpaid and unwaived -AND-
   *   - The remaining amount on the Deductible matches or exceeds that on the line item. Since the two amounts could possibly be in
   *     different currencies, it looks at the Line Item's Transaction, Reserving and Claim Currencies (in that order)
   *     and check if any of them match the Deductible(Coverage) Currency. If a match is found, it uses the
   *     corresponding amount on the Line Item to compare against the Deductible Amount.
   *
   * Otherwise, no link is made, and the line item's category is changed to "Former Deductible".
   * NOTE : This method should only be called on the onset payment in a recode operation or on the NEW check in a
   * transfer operation, and none of its line items should be linked to deductibles prior to this call.
   */
  public function linkDeductible() {
    for (tli in this.LineItems.where(\t -> t.LineCategory == TC_DEDUCTIBLE && !t.LinkedToDeductible)) {
      if (shouldLinkToDeductible(tli)) {
        SharedDeductible.linkItem_Core(tli)
      } else {
        tli.LineCategory = TC_FORMERDEDUCTIBLE
      }
    }
  }

  private function shouldLinkToDeductible(tli: TransactionLineItem) : boolean {
    return FinancialsUtil.isUseDeductibleHandling() &&
           SharedDeductible != null && !SharedDeductible.Waived &&
           tli.getAmountMatchingCurrency(SharedDeductible.Currency) != null
  }

  /**
   * Re-links former deductible line items to Deductible for resubmit, if necessary. This method examines the former
   * deductible line items on this payment, i.e. line items that have a line category of "Former Deductible". For each
   * such line item, updates it's Line Category from Former Deductible to Deductible and links it to the Deductible, if:
   *
   *   - the Deductible exists, is unpaid and unwaived -AND-
   *   - The remaining amount on the Deductible matches or exceeds that on the line item. Since the two amounts could possibly be in
   *     different currencies, it looks at the Line Item's Transaction, Reserving and Claim Currencies (in that order)
   *     and check if any of them match the Deductible(Coverage) Currency. If a match is found, it uses the
   *     corresponding amount on the Line Item to compare against the Deductible Amount.
   *
   *  Otherwise, no link is made.
   *
   * NOTE : This method should only be called before resubmit check operation, and none of its line items should be
   * linked to deductibles prior to this call.
   */
  public function relinkFormerDeductibleForResubmit() {
    for (tli in this.LineItems.where(\t -> t.LineCategory == LineCategory.TC_FORMERDEDUCTIBLE)) {
      if (shouldLinkToDeductible(tli)) {
        tli.LineCategory = LineCategory.TC_DEDUCTIBLE
        SharedDeductible.linkItem_Core(tli)
      }
    }
  }

  /**
   * Gets the validation messages for payments on the check wizard and quick check wizard
   * if payment is not valid, return DisplayKey.get("Java.Financials.CheckWizard.Error.Payment.PaymentExceedsReserves")
   * if payment line item has deductibles and the amount of deductibles is greater than the amount of
   *    other line items, return DisplayKey.get("Deductible.DeductibleAmountExceedsOtherLineItems")
   */
  function getCheckWizardPaymentValidationExpression() : String {
    if (!this.Valid) {
      return DisplayKey.get("Java.Financials.CheckWizard.Error.Payment.PaymentExceedsReserves")
    }

    if(this.LineItems.hasMatch(\elt1 -> elt1.LineCategory == LineCategory.TC_DEDUCTIBLE)) {
      var totalAmount = this.LineItems.sum(\li -> li.TransactionAmount.Amount ?: 0bd)
      if(totalAmount < 0) {
        return DisplayKey.get("Deductible.DeductibleAmountExceedsOtherLineItems")
      }
    }

    return null
  }

  /**
   * Returns true if there is a deductible that is applicable to this payment.
   * This controls whether the Apply Deductible button is visible in check wizards.
   *
   * Notably, this does not consider line items already on the transaction.
   * Contrast this with canAddDeductibleLineItem(), which determines whether the deductible
   * can actually be applied to the payment after line items are evaluated.
   *
   * @return true if there exists a deductible that is applicable to this payment
   */
  public property get DeductibleAvailable() : boolean {
    return FinancialsUtil.isAllowMultipleLineItems() and
        FinancialsUtil.isUseDeductibleHandling() and
        !this.Check.CheckSet.Recurring and
        this.SharedDeductible != null and
        this.SharedDeductible.HasRemainingAmount and
        !this.SharedDeductible.Waived and
        this.HasDeductibleApplicableCostType
  }

  /**
   * @return message if deductible is unapplied or overwithheld, null otherwise.
   */
  public property get DeductibleWarningMessage(): String {
    var deductible = this.SharedDeductible
    var message: String = null
    if (deductible.HasUnappliedDeductible) {
      message = DisplayKey.get("Web.NewCheckWizard.NewPaymentDetail.DeductibleUnapplied",
          deductible.AmountRemaining_Core.DisplayValue,
          deductible.DisplayName)
    } else if (deductible.HasOverwithheldDeductible) {
      message = DisplayKey.get("Web.NewCheckWizard.NewPaymentDetail.DeductibleOverwithheld",
          deductible.AmountRemaining_Core.abs().DisplayValue,
          deductible.DisplayName)
    }
    return message
  }

  /**
   Returns True if payment is related to the claim cost spending (not expenses or any other types), false otherwise.
   */
  public property get HasDeductibleApplicableCostType(): boolean {
    return this.CostType == CostType.TC_CLAIMCOST
  }

  /**
   * Returns true if the deductible has a matching currency with the payment.
   * This means that the deductible's currency must match at least one of:
   * 1. the payment's transaction currency
   * 2. the payment's reserving currency
   * 3. the claim currency
   * 4. the application default currency
   *
   * @return true if the deductible has a matching currency with the payment
   */
  public property get HasDeductibleApplicableCurrency() : boolean {
    var currency = this.SharedDeductible.Currency
    return currency == this.Currency or
        currency == this.ReservingCurrency or
        currency == this.Claim.Currency or
        currency == CurrencyUtil.ReportingCurrency
  }

  /**
   * Returns true if the deductible can be applied
   * This assumes there is a deductible that could be applied to this payment.
   * Contrast this with the DeductibleAvailable property, which determines whether an applicable deductible exists in the first place.
   *
   * This method returns true if
   * a) this payment has no deductible line items and
   * b) the deductible's currency matches one of the payment's currencies
   * c)
   *    1) deductible is over-withheld and needs to be refunded or
   *    2) deductible needs to be applied and this payment has positive line item(s) to offset
   *
   * Otherwise returns false.
   *
   * This controls the availability of the Apply Deductible button in check wizards.
   */
  public function canAddDeductibleLineItem(): boolean {
    return !this.hasDeductibleLineItem()
        and this.HasDeductibleApplicableCurrency
        and (this.LineItems.sum(\tli -> tli.TransactionAmount.Amount?:BigDecimal.ZERO) > 0
        or this.SharedDeductible.AmountRemaining_Core.Amount < 0)
  }

  public property get LabelForAddDeductibleButton(): String {
    if(this.SharedDeductible.AmountRemaining_Core.Amount >= 0) {
      return DisplayKey.get("NVV.Financials.NewPaymentDetail.Transaction.ApplyDeductible",
          this.SharedDeductible.AmountRemaining_Core)
    }
    else {
      return DisplayKey.get("NVV.Financials.NewPaymentDetail.Transaction.ApplyRefund",
          this.SharedDeductible.AmountRemaining_Core.abs())
    }
  }

  /**
  * Returns true if any Payeee of the parent check is Claimant or Insured, false otherwise.
  * */
  function isPayeeClaimant() : Boolean {
    for (payee in this.Check.Payees) {
      if (payee.PayeeType==TC_CLAIMANT or payee.PayeeType==TC_INSURED) {
        return true
      }
    }
    return false
  }

  /**
  * Returns true if Payment is new (not persisted), false otherwise.
  * */
  function isNewPayment() : boolean {
    return this.New
  }
}
