package gw.bizrules.ReserveRules

uses gw.api.util.LOBUtil

@Export
class ReserveRuleUtil {

  public construct() {}

  public function findApplicablePolicyTypesForLossType(lossType: LossType): Set<PolicyType> {
    if (lossType == null) {
      return Collections.unmodifiableSet(PolicyType.getTypeKeys(false).toSet())
    }
    return LOBUtil.getPolicyTypes(lossType).toSet()
  }

  public function findApplicableExposureTypesForLossTypeAndPolicyType(lossType: LossType, policyType: PolicyType = null): Set<ExposureType> {
    if (lossType == null and policyType == null) {
      return Collections.unmodifiableSet(ExposureType.getTypeKeys(false).toSet())
    }
    return LOBUtil.getExposureTypes(lossType, {policyType}).toSet()
  }

  public function findApplicableClaimSegmentsForLossType(lossType: LossType): Set<ClaimSegment> {
    if (lossType == null) {
      return Collections.unmodifiableSet(ClaimSegment.getTypeKeys(false).toSet())
    }
    return LOBUtil.getClaimSegments(lossType).toSet()
  }
}