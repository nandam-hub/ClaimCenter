package gw.api.claim

uses gw.api.locale.DisplayKey

@Export
class QuickClaimUIHelper {

  private var _claim : Claim
  private var _wizard : NewClaimWizardInfo

  construct (claim: Claim, wizard : NewClaimWizardInfo) {
    _claim = claim
    _wizard = wizard
  }

  property get InitializedAutoStep() : boolean {
    setClaimInitialValues()
    return true
  }

  property get PropertyExposure() : Exposure {
    setClaimInitialValues()
    var exposure = setExposuresValues(TC_CPBLDGCOV, TC_CPBLDGCOV, DisplayKey.get("Web.NewClaimWizard.QuickClaim.Property.Exposure.Description"))

    var claimInsured = _claim.Insured
    if (claimInsured != null) {
      exposure.Incident.incidentowner = claimInsured
    }
    return exposure
  }

  property get GLExposure() : Exposure {
    setClaimInitialValues()
    return setExposuresValues(TC_GLCGLCOV, TC_GLCGLCOV_OPS_GD)
  }

  property get ClaimAddress() : Address {
    if (_claim.LossLocation == null) {
      _claim.LossLocation = new Address(_claim);
      return _claim.LossLocation;
    }
    return new Address(_claim);
  }

  private function setClaimInitialValues () {
    if (!_claim.areInitialValuesSet()) {
      _claim.setInitialValues()
    }
  }

  private function setExposuresValues(covType: CoverageType, covSubType: CoverageSubtype,
                                      description: String = null) : Exposure{
    var exposures = _claim.OrderedExposures
    var exposure : Exposure
    if (exposures.length > 0) {
      exposure = exposures[0]
    } else {
      exposure = _wizard.addExposure(_claim, null, covType, covSubType)
      exposure.CreatedVia = CreatedVia.TC_UI_AUTOMATIC
      if (description != null) {
        exposure.Incident.Description = description
      }
    }
    return exposure
  }
}