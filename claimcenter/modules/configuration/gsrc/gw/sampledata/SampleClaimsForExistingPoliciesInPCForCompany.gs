package gw.sampledata

uses gw.api.databuilder.ClaimBuilder
uses gw.api.databuilder.ClaimInfoBuilder
uses gw.api.databuilder.ExposureBuilder
uses gw.api.databuilder.FixedPropertyIncidentBuilder
uses gw.api.databuilder.MobilePropertyIncidentBuilder
uses gw.api.databuilder.ReserveBuilder
uses gw.api.databuilder.ReserveLineBuilder
uses gw.api.databuilder.ReserveSetBuilder
uses gw.api.databuilder.TransactionLineItemBuilder
uses gw.api.locale.DisplayKey
uses gw.api.util.CurrencyUtil
uses gw.pl.persistence.core.Bundle
uses gw.plugin.Plugins
uses gw.plugin.policy.search.IPolicySearchAdapter

@Export
class SampleClaimsForExistingPoliciesInPCForCompany extends SampleDataBase {

  construct(inCache: SampleDataCache) {
    super(inCache)
  }

  override property get Description(): String {
    return DisplayKey.get("Web.CCSampleData.Claim.ClaimsForPoliciesExistingInPCForCompany")
  }

  override function testSampleData(bundle: Bundle) {
    createOpenCommercialPropertyClaimWithFinancials(bundle)
    createOpenCommercialPropertyClaimWithoutFinancials(bundle)
    createClosedCommercialPropertyClaimWithFinancials(bundle)
  }

  function create(bundle: Bundle) {
    testSampleData(bundle)
  }

  private function createCompanyPolicySearchCriteria(companyName: String, policyType: PolicyType): PolicySearchCriteria {
    var criteria = new PolicySearchCriteria()
    criteria.CompanyName = companyName
    criteria.PolicyType = policyType
    return criteria
  }

  private function findPolicy(policyStatus: PolicyStatus, criteria: PolicySearchCriteria, lossDate: Date): Policy {
    var searcher = Plugins.get(IPolicySearchAdapter)
    var result : PolicySearchResultSet = null
    try {
      result = searcher.searchPolicies(criteria)
    } catch ( e : Exception ) {
      return null
    }
    var summary = result.Summaries.firstWhere(\s -> s.Status == policyStatus)
    if (summary != null) {
      summary.setLossDate(lossDate)
      return searcher.retrievePolicyFromPolicySummary(summary).getResult()
    }
    return null
  }

  private function createCommercialPropertyBaseClaim(claimNumber: String, policy: Policy, lossDate: Date): ClaimBuilder {
    var contact = findPersonContactIn(policy)
    return claimBuilder()
        .withClaimNumber(claimNumber)
        .withPolicy(policy)
        .withLossDate(lossDate)
        .withReportedDate(lossDate.addDays(1))
        .withAssignmentStatus(TC_ASSIGNED)
        .withAssignedUser(findUserByUserName("wdufraine"))
        .withAssignmentDate(lossDate.addDays(2))
        .withLOBCode(TC_CPLINE)
        .withStrategy(TC_PROP_FAST)
        .withLossCause(TC_WIND)
        .withLossType(TC_PR)
        .withFault(80)
        .withAssignedGroup(findGroupByName("Midwest Property A"))
        .withJurisdictionState(TC_CA)
        .withSegment(TC_PROP_LOW)
        .withCoverageInQuestion(false)
        .withContactInRole(contact, TC_MAINCONTACT)
        .withContactInRole(contact, TC_REPORTER)
        .withLossLocation(policy.getAddresses().first())
  }

  private function findPersonContactIn(policy: Policy): Contact {
    var contact = policy.getContactsByRole(TC_INSURED).firstWhere(\c -> c typeis Person)
    return contact
  }

  private function createOpenCommercialPropertyClaimWithFinancials(bundle: Bundle) {
    var lossDate = Date.Now.addDays(-7)
    var policy = findPolicy(TC_INFORCE, createCompanyPolicySearchCriteria("Sherman Developments", TC_COMMERCIALPACKAGE), lossDate)
    if (policy == null) {
      return
    }
    var claimNumber = "235-53-425899"
    var contact = findPersonContactIn(policy)

    var claim = createCommercialPropertyBaseClaim(claimNumber, policy, lossDate)
        .withDescription("Broken windows due to windstorm, glass shards caused minor injuries to one person")
        .open()
        .create(bundle)

    new ClaimInfoBuilder()
        .withClaimNumber(claimNumber)
        .onClaim(claim)
        .create(bundle)

    var exposure = new ExposureBuilder()
        .withOtherCoverage(false)
        .withLossParty(TC_INSURED)
        .withExposureType(TC_PROPERTYDAMAGE)
        .withAssignedGroup(findGroupByName("Midwest Property A"))
        .withAssignmentStatus(TC_ASSIGNED)
        .withStrategy(TC_PROP_FAST)
        .withProgress(TC_INVESTIGATION)
        .withJurisdictionState(TC_IL)
        .withAssignmentDate(lossDate.addDays(1))
        .withPrimaryCoverage(TC_CPBLDGCOV)
        .withSegment(TC_PROP_LOW)
        .withClaimantType(TC_INSURED)
        .withClaimOrder(1)
        .withState(TC_OPEN)
        .withAssignedUser(findUserByUserName("rbarnes"))
        .onClaim(claim)
        .withCoverageSubType(TC_CPBLDGCOV)
        .withIncident(new FixedPropertyIncidentBuilder()
            .withSeverity(TC_MINOR)
            .withProperty(policy.getPolicyLocations().first())
            .withDescription("One large glass window broken by flying debris during storm"))
        .withContactInRole(contact, TC_CLAIMANT)
        .create(bundle)

    var transactionSet = new ReserveSetBuilder()
        .withApprovalDate(lossDate.addDays(3))
        .withRequestingUser(findUserByUserName("rbarnes"))
        .withApprovalStatus(TC_APPROVED)
        .onClaim(claim)
        .create(bundle)

    var reserveLine = new ReserveLineBuilder()
        .withExposure(exposure)
        .withCostType(TC_AOEXPENSE)
        .withCostCategory(TC_OTHER)
        .withClaim(claim)
        .create(bundle)

    new ReserveBuilder()
        .withReserveLine(reserveLine)
        .onExposure(exposure)
        .onTransactionSet(transactionSet)
        .withCostType(TC_AOEXPENSE)
        .withCostCategory(TC_OTHER)
        .withStatus(TC_SUBMITTED)
        .onClaim(claim)
        .withTransToClaimExchangeRate(CurrencyUtil.isSingleCurrencyMode() ?
            null :
            gw.api.database.Query.make(entity.ExchangeRate)
                .compare("PriceCurrency", Equals, Currency.TC_USD)
                .compare("BaseCurrency", Equals, Currency.TC_USD).select().FirstResult)
        .withLineItem(new TransactionLineItemBuilder()
            .withComments("Auto inspection fee")
            .withClaimForExAmount(0bd.ofDefaultCurrency())
            .withReportingAmount(1000bd.ofDefaultCurrency())
            .withClaimAmount(1000bd.ofDefaultCurrency())
            .withReservingAmount(1000bd.ofDefaultCurrency())
            .withTransactionAmount(1000bd.ofDefaultCurrency())
            .withLineCategory(TC_OTHER)
            .withReportingForExAmount(0bd.ofDefaultCurrency()))
        .create(bundle)

    // Explicit commit is needed here.
    // When we create new Claim method PolicyImpl#updatePolicyPeriods is called and this method uses
    // PolicyFinderImpl#findPolicyPeriod to check do we need to create new PolicyPeriod or not.
    // Finder uses Query and does not see PolicyPeriod that are not saved yet, so new PolicyPeriod will be created.
    // In result when changes in Bundle are committed DBDuplicateKeyException is throw.
    //noinspection ExplicitCommit
    bundle.commit()
  }

  private function createOpenCommercialPropertyClaimWithoutFinancials(bundle: Bundle) {
    var lossDate = Date.Now.addDays(-1)
    var policy = findPolicy(TC_INFORCE, createCompanyPolicySearchCriteria("Sherman Developments", TC_COMMERCIALPACKAGE), lossDate)
    if (policy == null) {
      return
    }
    var claimNumber = "235-53-425900"

    var claim = createCommercialPropertyBaseClaim(claimNumber, policy, lossDate)
        .withDescription("Flooding resulting in office equipment damage")
        .open()
        .create(bundle)

    new ClaimInfoBuilder()
        .withClaimNumber(claimNumber)
        .onClaim(claim)
        .create(bundle)

    // Explicit commit is needed here.
    // When we create new Claim method PolicyImpl#updatePolicyPeriods is called and this method uses
    // PolicyFinderImpl#findPolicyPeriod to check do we need to create new PolicyPeriod or not.
    // Finder uses Query and does not see PolicyPeriod that are not saved yet, so new PolicyPeriod will be created.
    // In result when changes in Bundle are committed DBDuplicateKeyException is throw.
    //noinspection ExplicitCommit
    bundle.commit()
  }

  private function createClosedCommercialPropertyClaimWithFinancials(bundle: Bundle) {
    var lossDate = Date.Now.addDays(-12)
    var policy = findPolicy(TC_INFORCE, createCompanyPolicySearchCriteria("Sherman Developments", TC_COMMERCIALPACKAGE), lossDate)
    if (policy == null) {
      return
    }
    var claimNumber = "235-53-425901"
    var contact = findPersonContactIn(policy)

    var claim = createCommercialPropertyBaseClaim(claimNumber, policy, lossDate)
        .withDescription("Apparent break-in overnight resulting in lost computers and other equipment")
        .closed()
        .withCloseDate(lossDate.addDays(5))
        .create(bundle)

    new ClaimInfoBuilder()
        .withClaimNumber(claimNumber)
        .onClaim(claim)
        .create(bundle)

    var exposure = new ExposureBuilder()
        .withOtherCoverage(false)
        .withLossParty(TC_INSURED)
        .withExposureType(TC_PERSONALPROPERTYDAMAGE)
        .withAssignedGroup(findGroupByName("Midwest Property A"))
        .withAssignmentStatus(TC_ASSIGNED)
        .withStrategy(TC_PROP_FAST)
        .withProgress(TC_INVESTIGATION)
        .withJurisdictionState(TC_IL)
        .withAssignmentDate(lossDate.addDays(1))
        .withPrimaryCoverage(TC_BOPPERSPROPOFFPREM)
        .withSegment(TC_PROP_LOW)
        .withClaimantType(TC_INSURED)
        .withClaimOrder(1)
        .withState(TC_OPEN)
        .withAssignedUser(findUserByUserName("rbarnes"))
        .onClaim(claim)
        .withCoverageSubType(TC_BOPPERSPROPOFFPREM)
        .withIncident(new MobilePropertyIncidentBuilder()
            .withSeverity(TC_MINOR)
            .withDescription("Equipment stolen"))
        .withContactInRole(contact, TC_CLAIMANT)
        .create(bundle)

    var transactionSet = new ReserveSetBuilder()
        .withApprovalDate(lossDate.addDays(4))
        .withRequestingUser(findUserByUserName("rbarnes"))
        .withApprovalStatus(TC_APPROVED)
        .onClaim(claim)
        .create(bundle)

    var reserveLine = new ReserveLineBuilder()
        .withExposure(exposure)
        .withCostType(TC_AOEXPENSE)
        .withCostCategory(TC_OTHER)
        .withClaim(claim)
        .create(bundle)

    new ReserveBuilder()
        .withReserveLine(reserveLine)
        .onExposure(exposure)
        .onTransactionSet(transactionSet)
        .withCostType(TC_AOEXPENSE)
        .withCostCategory(TC_OTHER)
        .withCurrency(gw.api.util.CurrencyUtil.getDefaultCurrency())
        .withStatus(TC_SUBMITTED)
        .onClaim(claim)
        .withTransToClaimExchangeRate(CurrencyUtil.isSingleCurrencyMode() ?
            null :
            gw.api.database.Query.make(entity.ExchangeRate).
                compare("PriceCurrency", Equals, Currency.TC_USD).
                compare("BaseCurrency", Equals, Currency.TC_USD).select().FirstResult)
        .withLineItem(new TransactionLineItemBuilder()
            .withComments("Property Damage repair")
            .withClaimForExAmount(0bd.ofDefaultCurrency())
            .withReportingAmount(1000bd.ofDefaultCurrency())
            .withClaimAmount(1000bd.ofDefaultCurrency())
            .withReservingAmount(1000bd.ofDefaultCurrency())
            .withTransactionAmount(1000bd.ofDefaultCurrency())
            .withLineCategory(TC_OTHER)
            .withReportingForExAmount(0bd.ofDefaultCurrency()))
        .create(bundle)

    // Explicit commit is needed here.
    // When we create new Claim method PolicyImpl#updatePolicyPeriods is called and this method uses
    // PolicyFinderImpl#findPolicyPeriod to check do we need to create new PolicyPeriod or not.
    // Finder uses Query and does not see PolicyPeriod that are not saved yet, so new PolicyPeriod will be created.
    // In result when changes in Bundle are committed DBDuplicateKeyException is throw.
    //noinspection ExplicitCommit
    bundle.commit()
  }
}


