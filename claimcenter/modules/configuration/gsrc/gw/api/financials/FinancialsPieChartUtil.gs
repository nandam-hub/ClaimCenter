package gw.api.financials

uses gw.api.locale.DisplayKey
uses java.math.BigDecimal

@Export
class FinancialsPieChartUtil {
  static function getFinancialsParameters(claim : Claim): Map<String, Integer> {
    var totalPaid = claim.TotalPaidClaimMetric.Value as BigDecimal ?: 0
    var openReserves = claim.ClaimRpt.OpenReserves.Amount ?: 0

    return {
        DisplayKey.get("Web.ClaimSummary.Headline.Financials.Paid") -> totalPaid.intValue(),
        DisplayKey.get("Web.ClaimSummary.Headline.Financials.OpenReserves") -> openReserves.intValue()
    }
  }
}
