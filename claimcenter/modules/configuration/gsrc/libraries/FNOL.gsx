package libraries

uses gw.api.locale.DisplayKey
uses gw.api.util.DisplayableException

/**
 * Creates exposures for worker's comp claims, if the state of the claim requires
 * them and they are not already present. Provides two different methods for
 * doing this, a legacy method based on severity and a newer approach based on
 * relevant fields on the claim. Customers may choose to use either method
 * (customized as necessary) but should not use both
 */
@Export
enhancement FNOL : entity.Claim {

  /**
   * Create exposures based on:
   * <ul>
   * <li>Medical or incident report flags set - create Medical Details exposure
   * <li>Time loss or death report flags set - create Time Loss exposure
   * <li>Employer liability flag set - create Employers Liability exposure
   * </ul>
   */
  function createRelevantWorkCompExposures() {
    //open WC Medical Exp if this is not an Incident Only report OR if Medical Report is specifically specified
    if (this.MedicalReport or !this.IncidentReport){
      createAndSetUpExposure(TC_WCWORKERSCOMPCOV, TC_WCWORKERSCOMPMED)
    }
    
    //open WC Time Loss Exp if Indemnity/TimeLossReport field is checked 
    if (this.TimeLossReport or this.DeathReport){
      createAndSetUpExposure(TC_WCWORKERSCOMPCOV, TC_WCWORKERSCOMPWAGES)
    }
    
    //open WC Employer's Liability Exp
    if (this.EmployerLiability) {
      createAndSetUpExposure(TC_WCEMPLIABCOV, TC_WCEMPLIABCOV)
    }

    linkWCExposuresToCoverages()
    
    ensureNoGapsInExposureNumbers()
  }

  /**
   * Sets the exposure's coverage if the following is true:
   * <ul>
   * <li> claim's policy coverage matches workers comp cov and the exposure's coverage subtype matches wc workers comp wages or med </li>
   * <li> claim's policy coverage matches emp liab cov and the exposure's coverage subtype matches emp liab cov </li>
   * </ul>
   */
  function linkWCExposuresToCoverages() {
    for (exposure in this.Exposures) {
      for (coverage in exposure.Claim.Policy.AllCoverages) {
        var isWorkersCompCov = coverage.Type == TC_WCWORKERSCOMPCOV and (exposure.CoverageSubType == TC_WCWORKERSCOMPWAGES or exposure.CoverageSubType == TC_WCWORKERSCOMPMED)
        var isWCEmpLiabCov = coverage.Type == TC_WCEMPLIABCOV and exposure.CoverageSubType == TC_WCEMPLIABCOV
        if (isWorkersCompCov or isWCEmpLiabCov) {
          exposure.Coverage = coverage
          break
        }
      }
    }
  }

  /**
   * Legacy method, create exposures based on claim severity
   */
  function createWcDefaultExposures() {
    if (this.ClaimInjuryIncident.Severity == TC_WC_ELL) {
      createAndSetUpExposure(TC_WCEMPLIABCOV, TC_WCEMPLIABCOV)
    } else {
      createAndSetUpExposure(TC_WCWORKERSCOMPCOV, TC_WCWORKERSCOMPMED)
      if (this.ClaimInjuryIncident.Severity != null
              and this.ClaimInjuryIncident.Severity != TC_CONTRACT_MEDICAL
              and this.ClaimInjuryIncident.Severity != TC_MEDICAL_ONLY) {
        createAndSetUpExposure(TC_WCWORKERSCOMPCOV, TC_WCWORKERSCOMPWAGES)
      }
    }

    linkWCExposuresToCoverages()

    ensureNoGapsInExposureNumbers()
  }

  /**
   * Create exposure with given coverage type and coverage subtype, unless it
   * is already present. If the claim is already open then set up the exposure
   * immediately (if the claim is draft then it will be set up at the end of
   * the new claim wizard)
   */
  private function createAndSetUpExposure(coverageType : CoverageType, coverageSubtype : CoverageSubtype) {
    if (not this.hasExposureOfType(this.getNewExposureType(coverageSubtype))) {
      if (this.State == ClaimState.TC_CLOSED) {
        throw new DisplayableException(DisplayKey.get("Java.AddExposure.Error.ClaimClosed"))
      }
      var exposure = this.newExposure(coverageType, coverageSubtype, true)
      exposure.CreatedVia = CreatedVia.TC_RULESET
      if (this.State == TC_OPEN) {
        exposure.saveAndSetup() 
      }
    }
  }

  private function ensureNoGapsInExposureNumbers() {
    var order = 1
    foreach (e in this.OrderedExposures) {
      e.ClaimOrder = order
      order++
    }
  }

}
