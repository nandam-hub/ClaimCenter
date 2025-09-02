package gw.entity

uses gw.config.CovTermAbstraction

@Export
enhancement GWClaimLossCauseEnhancement: Claim {

  property get ApplicableDeductibleCovTermChanged(): Boolean {
    return this.isFieldChanged(Claim#LossCause)
        and CoveragesWithPotentialDedCovTermChange.length != 0
  }

  property get DeductiblesWithNoPaymentsMade(): Deductible[] {
    return CoveragesWithPotentialDedCovTermChange.where(\coverage ->
        coverage.ClaimDeductible.TransactionLineItems.length == 0)*.ClaimDeductible
  }

  property get CoveragesWithPotentialDedCovTermChange(): Coverage[] {
    return this.Policy.AllCoverages.where(\coverage ->
        // only check for coverages that could have multiple deductible covterms
        CovTermAbstraction.getDefaultCovTerm(coverage) != null
            and coverage.ClaimDeductible != null
            and coverage.getDeductibleCovTerm(this.getOriginalValue(Claim#LossCause)) != coverage.getDeductibleCovTerm())
  }
}
