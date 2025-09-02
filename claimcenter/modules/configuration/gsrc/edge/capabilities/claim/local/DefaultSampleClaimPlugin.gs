package edge.capabilities.claim.local

uses edge.capabilities.claim.details.IClaimDetailPlugin
uses edge.capabilities.claim.details.dto.ClaimDTO
uses edge.di.annotations.ForAllGwNodes
uses gw.api.data.SampleClaimHelper
uses gw.plugin.Plugins
uses gw.plugin.policy.search.IPolicySearchAdapter
uses gw.transaction.Transaction

class DefaultSampleClaimPlugin implements ISampleClaimPlugin {
  private var _claimDetailPlugin: IClaimDetailPlugin

  @ForAllGwNodes
  @Param("claimDetailPlugin", "Plugin used to handle basic Claim manipulations")
  construct(claimDetailPlugin: IClaimDetailPlugin) {
    this._claimDetailPlugin = claimDetailPlugin
  }

  override function createSampleClaimForPolicy(policyNumber : String, claimState : ClaimState) : ClaimDTO {
    var policySummary = fetchPolicySummary(policyNumber)
    if (policySummary.Status != PolicyStatus.TC_INFORCE) {
      throw new UnsupportedOperationException("Sample claim can only be generated against a policy with IN-FORCE status")
    }

    if (policySummary.PolicyType != PolicyType.TC_PERSONALAUTO && policySummary.PolicyType != PolicyType.TC_HOPHOMEOWNERS) {
      throw new UnsupportedOperationException("Sample claims generation currently supports only PersonalAuto and HomeOwners claims")
    }

    var lobCode = getLOBCode(policySummary.PolicyType)
    var lossType = getLossType(policySummary.PolicyType)
    var lossCause = getSampleLossCause(policySummary.PolicyType)
    var claim = SampleClaimHelper.createSampleClaim(policySummary, lobCode, lossType, lossCause, claimState)
    return _claimDetailPlugin.toDTO(claim)
  }

  private function fetchPolicySummary(policyNumber: String): PolicySummary {
    var policySummary: PolicySummary = null
    Transaction.runWithNewBundle(\bundle -> {
      policySummary = Plugins.get(IPolicySearchAdapter).searchPolicies(new PolicySearchCriteria() {
        :PolicyNumber = policyNumber
      }).Summaries.first()
    })
    return policySummary
  }

  private function getLOBCode(policyType: PolicyType): LOBCode {
    return policyType == TC_PERSONALAUTO
        ? LOBCode.TC_PERSONALAUTOLINE // PA
        : LOBCode.TC_HOPLINE // HO
  }

  private function getLossType(policyType : PolicyType): LossType {
    return policyType == TC_PERSONALAUTO
        ? LossType.TC_AUTO // PA
        : LossType.TC_PR // HO
  }

  private function getSampleLossCause(policyType: PolicyType): LossCause {
    var sampleLossCauses: LossCause[] = policyType == TC_PERSONALAUTO
        ? {TC_ANIMAL, TC_VEHCOLLISION, TC_BIKECOLLISION, TC_FIXEDOBJCOLL, TC_LEFTCOLLISION, TC_FIRE, TC_ROLLOVER, TC_GLASSBREAKAGE, TC_VANDALISM} // PA
        : {TC_FIRE, TC_WATERDAMAGE, TC_BURGLARY, TC_VANDALISM, TC_GLASSBREAKAGE, TC_HAIL, TC_SNOWICE, TC_WIND, TC_ANIMAL, TC_STRUCTFAILURE} // HO
    var idx = new Random().nextInt(sampleLossCauses.length)
    return sampleLossCauses[idx]
  }
}
