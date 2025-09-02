package gw.claim.indicator
uses gw.api.locale.DisplayKey
uses gw.api.claim.indicator.ClaimIndicatorMethodsImpl
uses gw.config.LOBAbstraction

/**
 * Claim indicator that turns on if the claim is associated with a fatality
 */
@Export
class FatalityClaimIndicatorMethodsImpl extends ClaimIndicatorMethodsImpl {

  /**
   * Constructor, called when an indicator is created or read from the database
   */
  construct(inIndicator : FatalityClaimIndicator) {
    super(inIndicator, "fatality")
  }

  /**
   * Update; turns the indicator on if there is an injury incident with severity
   * "Fatal". For workers comp claims, checks the claim injury incident plus the
   * claim "DeathReport" field
   */
  override function update() {
    var fatal = false
    if (WorkersCompensationClaim) {
      fatal = IsWorkersCompFatal
    } else {
      fatal = Indicator.Claim.InjuryIncidentsOnly.hasMatch( \ i -> i.Severity == SeverityType.TC_FATAL)
    }
    setOn(fatal)
  }
  
  /**
   * Text label, list of people who died depending on whether indicator is on or off
   */
  override property get Text() : String {
    return Indicator.IsOn ? DisplayKey.get("Web.Claim.FatalityClaimIndicator.Fatalities.OnText")
            : null
  }

  /**
   * Hover text lists the people who died
   */
  override property get HoverText() : String {
    return Indicator.IsOn ? Fatalities : null
  }

  private property get Fatalities() : String {
    var result : String = null
    var claim = Indicator.Claim
    if (WorkersCompensationClaim) {
        if (IsWorkersCompFatal) {
          result = claim.claimant.DisplayName
        }
    } else {
      var injuredParties = claim.InjuryIncidentsOnly
      .where(\ i -> i.Severity == SeverityType.TC_FATAL and i.injured != null)
      .map(\ i -> i.injured)
      result = injuredParties.sort().join(DisplayKey.get("Web.Claim.FatalityClaimIndicator.FatalitySeparator"))
    }
    return DisplayKey.get("Web.Claim.FatalityClaimIndicator.FatalitiesPrefix") + result
  }

  private property get WorkersCompensationClaim() : boolean {
    return LOBAbstraction.ForClaim.ForLossType.isWorkComp(Indicator.Claim)
  }
  
  private property get IsWorkersCompFatal() : boolean {
    return Indicator.Claim.ClaimInjuryIncident.Severity == SeverityType.TC_FATAL or Indicator.Claim.ClaimWorkComp.DeathReport
  }
}
