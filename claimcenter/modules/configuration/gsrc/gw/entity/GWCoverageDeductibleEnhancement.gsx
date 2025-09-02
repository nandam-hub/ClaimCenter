package gw.entity
uses gw.api.financials.CurrencyAmount
uses gw.config.CovTermAbstraction

uses java.math.BigDecimal

@Export
enhancement GWCoverageDeductibleEnhancement : entity.Coverage {

  /**
   * Returns true if this Coverage has a change in its deductible.
   * This can happen if a deductible covterm is changed or
   * Master coverage deductible cov term is changed.
   */
  public function shouldUpdateDeductible(): boolean {
    return gw.api.financials.FinancialsUtil.isUseDeductibleHandling()
        and !this.New
        and (deductibleChanged()
        or (!HasDeductibleAmount and this.Master?.shouldUpdateDeductible())) //we should check Master coverage only when the current one doesn't have cov term
  }

  /**
   * @return true if the coverage currency changed or any covterms belong to the coverage changed
   */
  private function deductibleChanged(): boolean {
    return this.isFieldChanged(Coverage#Deductible)
        or this.isFieldChanged(Coverage#Currency)
        or (this.CovTerms.hasMatch(\covTerm -> covTerm.DeductibleParametersChanged))
        or (this.getRemovedArrayElements(Coverage#CovTerms).hasMatch(\covTerm -> covTerm.WasDeductible))
  }

  /**
   * If the coverage's new deductible amount is null and there are no payments,
   * then the deductible entity storing its calculated deductible
   * (if one exists) is removed. If the coverage's new deductible amount is null,
   * but payments do exist, then Deductible's Amount set to zero.
   * <p>
   * If the coverage's new deductible amount is not null, then its
   * calculated deductible's amount is recalculated based on the
   * coverage's new deductible, and set to unoverridden.
   * A new deductible entity is created if it does not yet exist.
   * <p>
   * This rule will execute once for every exposure on a coverage
   * whose deductible amount is updated. This is redundant, but
   * safe because the actions in this rule are idempotent, unless
   * the coverage's deductible amount is subsequently updated before
   * being committed, in which case this rule should be re-examined.
   */
  public function updateDeductibleEntry() {
    if(!DeductibleManuallyModified) {
      if (HasClaimDeductibleAmount) {
        createOrUpdateDeductible()
      } else {
        removeDeductible()
      }
    }
  }

  /**
   * @return true if either this coverage or its master coverage has deductible cov term with amount > 0
   */
  private property get HasClaimDeductibleAmount(): boolean {
    return this.HasDeductibleAmount || this.Master?.HasDeductibleAmount
  }

  /**
   * Removes Deductible entity if there are no payments using this or resets it to zero otherwise.
   */
  private function removeDeductible() {
    if(this.ClaimDeductible.TransactionLineItems.HasElements) {
      this.ClaimDeductible.Amount = new CurrencyAmount(BigDecimal.ZERO, this.ClaimDeductible.Currency)
    }
    else {
      this.ClaimDeductible?.remove()
    }
  }

  /**
   * @return true if Coverage's deductible is waived or overridden
   */
  private property get DeductibleManuallyModified(): boolean {
    var deductible = this.Deductibles.first()
    return deductible != null ? (deductible.Waived or deductible.Overridden) : false
  }

  /**
   * Creates or updates a deductible and associates it with the given claim (expecting it to be related to the coverage as well).
   */
  private function createOrUpdateDeductible() {
    var claim = this.Policy.Claim;
    var coverage = CoverageWithDeductibleCovTerm
    if(coverage == null) {
      return
    }

    var deductible = coverage.Deductibles.first() ?: new Deductible()

    if(deductible.TransactionLineItems.HasElements and deductible.Currency != coverage.Currency) {
      return;
    }

    deductible.Claim = claim
    deductible.Coverage = coverage
    deductible.Currency = coverage.Currency
    deductible.Amount = coverage.DeductibleAmount
  }

  private property get CoverageWithDeductibleCovTerm(): Coverage {
    var coverage = this;
    while (coverage != null and !coverage.HasDeductibleAmount) {
      coverage = coverage.Master
    }

    return coverage
  }

  /**
   * Returns whether this coverage has a deductible coverage term with a nonnull total amount.
   * @return true if this coverage has a nonnull deductible total amount, false otherwise
   */
  public property get HasDeductibleAmount() : boolean {
    return this.getDeductibleCovTerm().HasAmount
  }

  /**
   * Returns deductible amount from respective cov term or null if absent.
   * @return coverage term amount
   */
  public property get DeductibleAmount() : CurrencyAmount {
    return HasDeductibleAmount ? this.getDeductibleCovTerm().getFinancialAmount() : null
  }

  /**
   * Returns the coverage term containing the deductible information for this coverage.
   * If the policy supports multiple deductible coverage terms, and multiple deductible coverage terms exist on this coverage,
   * then the term selected will be based on loss cause, either the passed in loss cause, or the policy's current loss cause.
   * If the policy does not support multiple coverage terms, then the first deductible coverage term is returned
   * (it is considered an error in configuration to have more than one deductible coverage term for a coverage when
   * multiple deductible coverage terms are not supported).
   *
   * A deductible coverage term is a coverage term of type FinancialCovTerm and with a model type of Deductible.
   *
   * @param lossCause if provided, this is used to determine which deductible coverage term to return if more than one exist
   * @return the deductible coverage term associated with this coverage
   */
  public function getDeductibleCovTerm(lossCause: LossCause = null): FinancialCovTerm {
    lossCause = (lossCause == null) ? this.Policy.Claim.LossCause : lossCause
    var deductibleCovTerms = this.CovTerms.where(\covterm -> covterm.Deductible)

    // multiple deductible covterms applies to certain policy types so we are filtering on PolicyType here
    if (CovTermAbstraction.isMultiDedCovTermSupported(this.Policy.PolicyType) and deductibleCovTerms.length > 1) {
      // filtering deductible covterms by claim loss cause and sorting them by amount
      var mappedCovTerms = new TreeSet<FinancialCovTerm>(\o1, o2 ->
          o1.FinancialAmount.Amount.compareTo(o2.FinancialAmount.Amount)
      )
      for (covterm in deductibleCovTerms) {
        if (covterm.CovTermPattern.hasCategory(lossCause)) {
          mappedCovTerms.add(covterm as FinancialCovTerm)
        }
      }

      if (mappedCovTerms.size() >= 1) {
        // if there's only one match, return that deductible covterm
        // if there's multiple matching deductibles covterms return the first one as it has the smallest amount
        return mappedCovTerms.first()
      } else {
        // if there's no match return the default deductible covterm
        return CovTermAbstraction.getDefaultCovTerm(this) as FinancialCovTerm
      }
    } else {
      // for other LOBs or if there's only one deductible covterm, return the first deductible covterm
      return deductibleCovTerms.first() as FinancialCovTerm
    }
  }
}
