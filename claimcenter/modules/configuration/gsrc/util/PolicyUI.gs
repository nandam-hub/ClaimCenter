package util

uses gw.api.locale.DisplayKey

@Export
class PolicyUI {

  construct() {
  }

  static function handleCoverageCurrencyUpdate(coverage : Coverage) : String {
    if (coverage.ClaimDeductible != null && coverage.isFieldChanged(Coverage#Currency)) {
      gw.api.util.LocationUtil.addRequestScopedInfoMessage(DisplayKey.get("Deductible.Info.CurrencyUpdatedForDeductible"))
    }

    return null
  }
}
