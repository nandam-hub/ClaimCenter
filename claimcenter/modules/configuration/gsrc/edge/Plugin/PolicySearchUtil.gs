package edge.Plugin

internal class PolicySearchUtil {

  private construct() {
  }

  /**
   * Assigns PolicySystemId to RiskUnits if it is not set
   *
   * Note: PolicySearchPolicyGenerator.generatePolicies() does not assign PolicySystemId for most risk units, but it is
   * important for CAPolicySummaryPlugin and CPPolicySummaryPlugin to have one.
   */
  static function assignPolicySystemIds(policy: Policy) {
    policy.RiskUnits
        .where(\riskUnit -> riskUnit.PolicySystemId == null)
        .each(\riskUnit -> {
          riskUnit.PolicySystemId = "num:${riskUnit.RUNumber}"
          if (riskUnit typeis VehicleRU) {
            (riskUnit as VehicleRU).Vehicle.PolicySystemId = riskUnit.PolicySystemId
          }
      })
  }
}
