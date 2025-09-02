package gw.entity
uses gw.config.LOBAbstraction
uses gw.financials.ExposureCoverageUpdateResult

@Export
enhancement GWExposureCoverageEnhancement : entity.Exposure {

  public property get HasCoverageLimit() : boolean {
    return this.Coverage != null and
           this.Coverage.HasExposureLimit
  }

  /**
   * updateCoverage will help a pcf to change the coverage on an exposure.
   * Specifically, there may be a need to remove and/or create a new deductible
   */
  public function updateCoverage(coverage : Coverage) : ExposureCoverageUpdateResult {
    var result = new ExposureCoverageUpdateResult(this.Coverage.ClaimDeductible)

    if (this.Coverage.ClaimDeductible != null and
        !areExposuresLinkedTo(this.Coverage)) {
      this.Coverage.ClaimDeductible.remove()
    }

    setupCoverage(coverage)

    return result
  }

  private function areExposuresLinkedTo(cov : Coverage) : boolean {
    return this.Claim.Exposures.hasMatch(\ e -> e.Coverage == cov and not this.equals(e))
  }

  function updateCoverage(riskUnit : VehicleRU) {
    removeOldClaimDeductible()

    for (var coverage in riskUnit.Coverages) {
      //match the coverage type
      if (coverage.Type == this.PrimaryCoverage) {
        setupCoverage(coverage)
      }
    }
  }

  private function setupCoverage(coverage: Coverage) {
    this.Coverage = coverage
    if(gw.api.financials.FinancialsUtil.isUseDeductibleHandling()) {
      this.Coverage?.updateDeductibleEntry()
    }
  }

  function removeOldClaimDeductible() {
    if (this.Coverage.ClaimDeductible != null) {
      this.Coverage.ClaimDeductible.remove()
    }
  }

  /**
   * @return true if the coverage subtype of this exposure is Homeowners - Personal Property
   */
  property get HomeownersPersonalPropertyCoverageSubtype(): boolean {
    return this.CoverageSubType == LOBAbstraction.ForPolicy.ForHomeowners.getPersonalPropertyCoverageSubtype(this.Claim.Policy)
  }

  /**
   * @return true if the coverage subtype of this exposure is Homeowners - Property Damage Personal Liability
   */
  property get HomeownersPersonalLiabilityCoverageSubtype(): boolean {
    return this.CoverageSubType == LOBAbstraction.ForPolicy.ForHomeowners.getPersonalLiabilityPDCoverageSubtype(this.Claim.Policy)
  }

  /**
   * returns the amount of ExposureLimit on exposure's coverage as an integer,
   * or zero if this exposure does not have coverage or it coverage does not have an exposure limit
   */
  property get ExposureLimit() : int {
    return this.HasCoverageLimit ? this.Coverage.ExposureLimit.Amount.intValue() : 0
  }

  /**
   * returns the amount of IncidentLimit on exposure's coverage as an integer,
   * or zero if this exposure does not have coverage or it coverage does not have an incident limit
   */
  property get IncidentLimit() : int {
    return (this.Coverage != null and this.Coverage.HasIncidentLimit) ? this.Coverage.IncidentLimit.Amount.intValue() : 0
  }
}
