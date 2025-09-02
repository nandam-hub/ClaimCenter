package gw.pcf

@Export
class PolicyUtils {
  private construct() {}

  public static function isDeductiblePresent(policy: dynamic.Dynamic): boolean {
    for(coverage in policy.Coverages) {
      if(coverage.Deductible != null && coverage.Deductible.Amount != null) {
        return true
      }
    }
    return false
  }

  public static function isDeductiblePresent(policy: Policy): boolean {
    for(coverage in policy.Coverages) {
      if(coverage.Deductible != null && coverage.Deductible.Amount != null) {
        return true
      }
    }
    return false
  }
}