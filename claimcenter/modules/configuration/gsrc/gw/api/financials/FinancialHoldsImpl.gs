package gw.api.financials

@Export
class FinancialHoldsImpl implements FinancialHolds {

  private var _claim: Claim

  construct(claim: Claim) {
    _claim = claim
  }

  override function applyFinancialHolds() : Boolean {
    return _claim.CoverageInQuestion
        or _claim.IncidentReport
        or not _claim.Policy.Verified
  }
}