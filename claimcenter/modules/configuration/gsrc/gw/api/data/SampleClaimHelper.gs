package gw.api.data

uses gw.api.databuilder.AddressBuilder
uses gw.api.databuilder.ClaimBuilder
uses gw.api.databuilder.SequentialIntegerGenerator
uses gw.plugin.pcintegration.pc1000.PolicySearchPCPlugin
uses gw.transaction.Transaction
uses java.util.Date

class SampleClaimHelper {
  static var _numGen = new SequentialIntegerGenerator(100)
  private static var CLAIM_PREFIX = "123-45-000"

  public static function createSampleClaim(policySummary: PolicySummary, lobCode: LOBCode, lossType: LossType, lossCause: LossCause, claimState: ClaimState, claimNumber: String = null, additionalActions : block(ClaimBuilder, Policy) = null): Claim {
    if (policySummary.ExpirationDate.before(Date.Today)) {
      throw new UnsupportedOperationException("Sample claim can only be generated against a policy which is not expired yet")
    }

    if (claimNumber == null) {
      claimNumber = getNextClaimNumber()
    }

    var claim: Claim = null

    Transaction.runWithNewBundle(\bundle -> {

      if (policySummary.LossDate == null) {
        policySummary.setLossDate(new Date())
      }

      var policy = new PolicySearchPCPlugin().retrievePolicyFromPolicySummary(policySummary).Result

      var claimBuilder = new gw.api.databuilder.ClaimBuilder()
          .withLOBCode(lobCode)
          .withAssignmentStatus(TC_ASSIGNED)
          .withLossDate(policySummary.LossDate)
          .withAssignmentDate(Date.Today)
          .withLossType(lossType)
          .withLossCause(lossCause)
          .withMainContactType(TC_SELF)
          .withReportedByType(TC_SELF)
          .withValidationLevel(TC_NEWLOSS)
          .withPolicy(policy)
          .withJurisdictionState(TC_CA)
          .withReportedDate(Date.Today)
          .withDescription("Sample Claim")
          .withState(claimState)
          .withContactInRole(policy.insured, TC_REPORTER)
          .withLossLocation(AddressBuilder.uiReadyUSA())

      if (policy.insured typeis Person) {
        claimBuilder.withContactInRole(policy.insured, TC_MAINCONTACT)
      }

      if (claimNumber != null) {
        claimBuilder.withClaimNumber(claimNumber)
      }

      if (additionalActions != null) {
        additionalActions(claimBuilder, policy)
      }

      claim = claimBuilder.create(bundle)
    })
    return claim
  }

  public static function getNextClaimNumber(): String {
    var id = _numGen.create(null)
    var claimNo = CLAIM_PREFIX + id

    //make sure there are no duplicates
    while(Claim.finder.findClaimByClaimNumber(claimNo) != null) {
      id++;
      claimNo = CLAIM_PREFIX + id
    }
    return claimNo
  }
}
