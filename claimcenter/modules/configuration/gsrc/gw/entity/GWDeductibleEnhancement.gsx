package gw.entity
uses gw.api.financials.CurrencyAmount
uses gw.api.locale.DisplayKey
uses gw.api.util.CurrencyUtil
uses gw.util.DeductibleCalculator
uses gw.api.util.DisplayableException

@Export
enhancement GWDeductibleEnhancement : Deductible {
  /**
   * Recalculates the amount that this deductible should use to apply to a payment.
   * Assumes that this deductible is already linked to a coverage.
   */
  public function recalculateAmount() {
    this.Currency = this.Coverage.Currency
    this.Amount = DeductibleCalculator.calculateDeductibleAmountForCoverage(this.Coverage)
  }

  /**
   * generate a string for "amount paid/unpaid/waived" to display on the DeductibleInputSet
   */
  property get DisplayAmount() : String {
    return this.Waived ?
        DisplayKey.get("Deductible.Summary.Waived", this.Amount) :
        DisplayKey.get("Deductible.Summary.Applied", this.AmountApplied_Core, this.Amount)
  }

  /**
   * Returns whether this deductible's remaining amount is zero.
   *
   * @return true if this deductible's remaining amount is zero
   */
  property get HasRemainingAmount(): boolean {
    return this.AmountRemaining_Core.Amount != 0
  }

  /**
   * Returns whether this deductible's linked transaction line items match or underutilized its amount.
   * This is equivalent to whether this deductible has a positive remaining amount.
   *
   * @return true if this deductible has positive remaining amount
   */
  property get HasUnappliedDeductible(): boolean {
    return this.AmountRemaining_Core.Amount > 0
  }

  /**
   * Returns whether this deductible's linked transaction line items match or overutilized its amount.
   * This is equivalent to whether this deductible has a negative remaining amount.
   *
   * @return true if this deductible has negative remaining amount
   */
  property get HasOverwithheldDeductible(): boolean {
    return this.AmountRemaining_Core.Amount < 0
  }
}
