package gw.api.data

uses edge.di.annotations.ForAllGwNodes
uses entity.Policy
uses entity.PolicySearchCriteria
uses entity.PolicySummary
uses gw.api.database.Query
uses gw.api.databuilder.ClaimBuilder
uses gw.api.databuilder.ServiceRequestBuilder
uses gw.api.databuilder.ServiceRequestInstructionBuilder
uses gw.plugin.contact.ab1000.ABContactSystemPlugin
uses gw.plugin.pcintegration.pc1000.PolicySearchPCPlugin
uses gw.sampledata.SampleSpecialistServicesBase
uses gw.transaction.Transaction
uses typekey.*

class ClaimProvider implements ISampleDataProvider {
  private final var MMURPHY = "3122297458"
  private final var HMIKU = "7401883862"
  private final var CRYPTON = "2038241321"
  private final var PE_ACCOUNTS = {HMIKU, CRYPTON}

  private var _contactCache : Contact

  @ForAllGwNodes
  construct() {
  }

  property get PersonalAccountNumbers() : String[] {
    return {MMURPHY, "9401883862", "8703719436", HMIKU}
  }

  property get CompanyAccountNumbers() : String[] {
    return {CRYPTON}
  }

  override property get CollectionName() : String {
    return "Sample Portals Claims"
  }

  override property get AlreadyLoaded() : boolean {
    return PersonalAccountNumbers.allMatch(\accountNumber ->
        Query.make(Claim).join(Claim#Policy).compare(Policy#AccountNumber, Equals, accountNumber).select().Count > 0
    )
  }

  override function load() {
    PersonalAccountNumbers.each(\accountNumber -> {
      if (accountNumber == MMURPHY || accountNumber == HMIKU) {
        // Create PA and HO Claims with different loss causes
        loadPAClaimsWithDiffLossCauses(accountNumber)
        loadHOClaimsWithDiffLossCauses(accountNumber)
      } else {
        loadPAClaim(accountNumber)
        loadHOClaim(accountNumber)
      }

      // Continue loading claims for other policy types
      loadBOPClaim(accountNumber)
      loadBAClaim(accountNumber)
    })

    CompanyAccountNumbers.each(\accountNumber -> {
      loadBOPClaim(accountNumber)
      loadBAClaim(accountNumber)
    })
  }

  private function loadPAClaimsWithDiffLossCauses(accountNumber : String) {
    var lossCauses : LossCause[] = {TC_VEHCOLLISION, TC_THEFTENTIRE, TC_BROKEN_GLASS}
    var policySummary = fetchPolicySummary(accountNumber, TC_PERSONALAUTO)
    lossCauses.eachWithIndex(\lossCause, lcIndex -> {
      SampleClaimHelper.createSampleClaim(policySummary, TC_PERSONALAUTOLINE, TC_AUTO, lossCause, TC_OPEN, null, getCommonAdditionalActions(accountNumber))
    })
  }

  private function loadPAClaim(accountNumber : String) {
    var policySummary = fetchPolicySummary(accountNumber, TC_PERSONALAUTO)
    SampleClaimHelper.createSampleClaim(policySummary, TC_PERSONALAUTOLINE, TC_AUTO, TC_VEHCOLLISION, TC_OPEN, null, getCommonAdditionalActions(accountNumber))
  }

  private function loadHOClaimsWithDiffLossCauses(accountNumber : String) {
    var lossCauses : LossCause[] = {TC_FIRE, TC_WATERDAMAGE, TC_BURGLARY}
    var policySummary = fetchPolicySummary(accountNumber, TC_HOPHOMEOWNERS)

    lossCauses.each(\lossCause -> {
      SampleClaimHelper.createSampleClaim(policySummary, TC_HOPLINE, TC_PR, lossCause, TC_OPEN, null, getHOAdditionalAssignments(accountNumber))
    })
  }

  private function loadHOClaim(accountNumber : String) {
    var policySummary = fetchPolicySummary(accountNumber, TC_HOPHOMEOWNERS)
    SampleClaimHelper.createSampleClaim(policySummary, TC_HOPLINE, TC_PR, TC_WATERDAMAGE, TC_OPEN, null, getHOAdditionalAssignments(accountNumber))
  }

  private function getHOAdditionalAssignments(accountNumber : String) : block(ClaimBuilder, Policy) {
    return \claimBuilder : ClaimBuilder, policy : Policy -> {
      claimBuilder.withLossLocation(policy.insured.PrimaryAddress)
      if (PE_ACCOUNTS.contains(accountNumber)) {
        addServiceRequest(claimBuilder, policy)
      }
    }
  }

  private function loadBOPClaim(accountNumber : String) {
    var policySummary = fetchPolicySummary(accountNumber, PolicyType.TC_BUSINESSOWNERS)
    SampleClaimHelper.createSampleClaim(policySummary, TC_BOPLINE, TC_GL, TC_BREACH, TC_OPEN, null, getCommonAdditionalActions(accountNumber))
  }

  private function loadBAClaim(accountNumber : String) {
    var policySummary = fetchPolicySummary(accountNumber, PolicyType.TC_BUSINESSAUTO)
    SampleClaimHelper.createSampleClaim(policySummary, TC_BUSINESSAUTOLINE, TC_AUTO, TC_VEHCOLLISION, TC_OPEN, null, getCommonAdditionalActions(accountNumber))
  }

  private function getCommonAdditionalActions(accountNumber : String) : block(ClaimBuilder, Policy) {
    return \claimBuilder : ClaimBuilder, policy : Policy -> {
      if (PE_ACCOUNTS.contains(accountNumber)) {
        addServiceRequest(claimBuilder, policy)
      }
    }
  }

  private function addServiceRequest(claimBuilder : ClaimBuilder, policy : Policy) {
    claimBuilder.withServiceRequest(new ServiceRequestBuilder()
        .withRequestedServiceCompletionDateGw(Date.Tomorrow)
        .withExpectedServiceCompletionDateGw(Date.Today.addBusinessDays(5))
        .withKind(TC_SERVICEONLY)
        .withInstruction(new ServiceRequestInstructionBuilder()
            .withCustomerContactGw(policy.insured)
            .withSpecialistService(SampleSpecialistServicesBase.AutoRepairGlass)
            .withServiceAddressGw(policy.insured.AddressOwner.Address)
        )
        .withSpecialist(_expressAutoContact)
        .withSpecialistCommMethodGw(SpecialistCommMethod.TC_GWPORTAL)
        .withProgress(ServiceRequestProgress.TC_REQUESTED)
    )
  }

  private function fetchPolicySummary(accountNumber : String, policyType : PolicyType) : PolicySummary {
    var policySummary : PolicySummary = null
    Transaction.runWithNewBundle(\bundle -> {
      policySummary = new PolicySearchPCPlugin().searchPolicies(new PolicySearchCriteria() {
        :AccountNumber = accountNumber,
        :PolicyType = policyType
      }).Summaries.first()
    })
    return policySummary
  }

  private property get _expressAutoContact(): Contact {
    if (_contactCache != null) {
      return _contactCache
    } else {
      Transaction.runWithNewBundle(\bundle -> {
        _contactCache = new ABContactSystemPlugin().retrieveContact("absample:2")
      })
      return _contactCache
    }
  }
}
