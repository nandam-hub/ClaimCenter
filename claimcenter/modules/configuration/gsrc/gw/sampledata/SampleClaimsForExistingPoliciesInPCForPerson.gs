package gw.sampledata

uses gw.api.database.Query
uses gw.api.databuilder.BodyPartDetailsBuilder
uses gw.api.databuilder.CheckBuilder
uses gw.api.databuilder.CheckPayeeBuilder
uses gw.api.databuilder.CheckSetBuilder
uses gw.api.databuilder.ClaimBuilder
uses gw.api.databuilder.ClaimInfoBuilder
uses gw.api.databuilder.DwellingIncidentBuilder
uses gw.api.databuilder.ExposureBuilder
uses gw.api.databuilder.InjuryIncidentBuilder
uses gw.api.databuilder.PaymentBuilder
uses gw.api.databuilder.PropertyWaterDamageBuilder
uses gw.api.databuilder.ReserveBuilder
uses gw.api.databuilder.ReserveLineBuilder
uses gw.api.databuilder.TransactionLineItemBuilder
uses gw.api.locale.DisplayKey
uses gw.api.util.CurrencyUtil
uses gw.pl.persistence.core.Bundle
uses gw.plugin.Plugins
uses gw.plugin.policy.search.IPolicySearchAdapter

@Export
class SampleClaimsForExistingPoliciesInPCForPerson extends SampleDataBase {

  construct(inCache: SampleDataCache) {
    super(inCache)
  }

  override property get Description(): String {
    return DisplayKey.get("Web.CCSampleData.Claim.ClaimsForPoliciesExistingInPCForPerson")
  }

  override function testSampleData(bundle: Bundle) {
    createClosedPersonalAutoClaimWithFinancials(bundle)
    createOpenPersonalAutoClaimWithoutFinancials(bundle)
    createClosedPersonalAutoClaimWithoutFinancials(bundle)
    createOpenHomeOwnersClaimWithFinancials(bundle)
  }

  function create(bundle: Bundle) {
    testSampleData(bundle)
  }

  private function createPersonalPolicySearchCriteria(name: String, lastName: String, policyType: PolicyType): PolicySearchCriteria {
    var criteria = new PolicySearchCriteria()
    criteria.FirstName = name
    criteria.LastName = lastName
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

  private function createPersonalAutoBaseClaim(claimNumber: String, policy : Policy, lossDate: Date): ClaimBuilder {
    var contact = policy.getContactByRole(TC_INSURED)
    return claimBuilder()
        .withClaimNumber(claimNumber)
        .withPolicy(policy)
        .withLossDate(lossDate)
        .withReportedDate(lossDate.addDays(1))
        .withAssignmentStatus(TC_ASSIGNED)
        .withAssignedUser(findUserByUserName("aapplegate"))
        .withAssignmentDate(lossDate.addDays(2))
        .withLOBCode(TC_PERSONALAUTOLINE)
        .withStrategy(TC_AUTO_FAST)
        .withLossCause(TC_VEHCOLLISION)
        .withLossType(TC_AUTO)
        .withFault(80)
        .withAssignedGroup(findGroupByName("Auto1 - TeamA"))
        .withJurisdictionState(TC_CA)
        .withSegment(TC_AUTO_LOW)
        .withCoverageInQuestion(false)
        .withContactInRole(contact, TC_MAINCONTACT)
        .withContactInRole(contact, TC_REPORTER)
        .withLossLocation(policy.getAddresses().first())
  }

  private function createClosedPersonalAutoClaimWithFinancials(bundle: Bundle) {
    var lossDate = Date.Now.addDays(-7)
    var policy = findPolicy(TC_INFORCE, createPersonalPolicySearchCriteria("Mike", "Sherman", TC_PERSONALAUTO), lossDate)
    if (policy == null) {
      return
    }
    var claimNumber = "235-53-425895"
    var contact = policy.getContactByRole(TC_INSURED)

    var claim = createPersonalAutoBaseClaim(claimNumber, policy, lossDate)
        .withDescription("Car plowed into a fire hydrant")
        .closed()
        .withCloseDate(lossDate.addDays(5))
        .create(bundle)

    new ClaimInfoBuilder()
        .withClaimNumber(claimNumber)
        .onClaim(claim)
        .create(bundle)

    var exposure = new ExposureBuilder()
        .withOtherCoverage(false)
        .withLossParty(TC_THIRD_PARTY)
        .withExposureType(TC_BODILYINJURYDAMAGE)
        .withAssignedGroup(findGroupByName("Auto1 - TeamA"))
        .withAssignmentStatus(TC_ASSIGNED)
        .withStrategy(TC_INJURY_NORMAL)
        .withProgress(TC_INVESTIGATION)
        .withJurisdictionState(TC_CA)
        .withAssignmentDate(lossDate.addDays(2))
        .withSegment(TC_INJURY_MID)
        .withClaimantType(TC_VEH_OTHER_OWNER)
        .withState(TC_OPEN)
        .withAssignedUser(findUserByUserName("aapplegate"))
        .onClaim(claim)
        .withCoverageSubType(TC_PALIABILITYCOV_BI)
        .withIncident(new InjuryIncidentBuilder()
            .withLossParty(TC_THIRD_PARTY)
            .withGeneralInjuryType(TC_SPECIFIC)
            .withSeverity(TC_MAJOR_INJURY)
            .withDescription("Bruises and lacerations to face and neck, broken orbital bone, potential vision loss")
            .withMedicalTreatmentType(TC_HOSPITAL)
            .withDetailedInjuryType(TC_58)
            .withLostWages(true)
            .withBodyPart(new BodyPartDetailsBuilder()
                .withPrimaryBodyPart(TC_HEAD)
                .withOrdering(100))
            .withContactInRole(contact, TC_INJURED))
        .withContactInRole(contact, TC_CLAIMANT)
        .create(bundle)


    var reserveLine = new ReserveLineBuilder()
        .withExposure(exposure)
        .withClaim(claim)
        .create(bundle)

    var transactionSet = new CheckSetBuilder()
        .withApprovalDate(lossDate.addDays(3))
        .withRequestingUser(findUserByUserName("aapplegate"))
        .withApprovalStatus(TC_APPROVED)
        .onClaim(claim)
        .create(bundle)

    var check = new CheckBuilder()
        .onClaim(claim)
        .withIssueDate(lossDate.addDays(3))
        .withScheduledSendDate(lossDate.addDays(3))
        .withBankAccount(TC_DEFAULT)
        .onCheckSet(transactionSet)
        .withPayTo("William Weeks")
        .withStatus(TC_ISSUED)
        .withPaymentMethod(TC_CHECK)
        .withCheckNumber("11059")
        .withPayee(new CheckPayeeBuilder()
            .withPayee(contact)
            .withPayeeType(TC_CLAIMANT))
        .withType(TC_PRIMARY)
        .create(bundle)

    new PaymentBuilder()
        .withReserveLine(reserveLine)
        .onTransactionSet(transactionSet)
        .withCostCategory(TC_MEDICAL)
        .withCurrency(CurrencyUtil.getDefaultCurrency())
        .withStatus(TC_SUBMITTED)
        .withTransToClaimExchangeRate(CurrencyUtil.isSingleCurrencyMode() ?
            null :
            Query.make(entity.ExchangeRate).compare("PriceCurrency", Equals, Currency.TC_USD)
                .compare("BaseCurrency", Equals, Currency.TC_USD)
                .select()
                .FirstResult)
        .onCheck(check)
        .withPaymentType(TC_PARTIAL)
        .onExposure(exposure)
        .withCostType(TC_CLAIMCOST)
        .onClaim(claim)
        .withLineItem(new TransactionLineItemBuilder()
            .withComments("Initial hospitalization and examination")
            .withClaimForExAmount(0bd.ofDefaultCurrency())
            .withReportingAmount(9000bd.ofDefaultCurrency())
            .withClaimAmount(9000bd.ofDefaultCurrency())
            .withReservingAmount(9000bd.ofDefaultCurrency())
            .withTransactionAmount(9000bd.ofDefaultCurrency())
            .withLineCategory(TC_DOCTOR)
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

  private function createOpenPersonalAutoClaimWithoutFinancials(bundle: Bundle) {
    var lossDate = Date.Now.addDays(-14)
    var policy = findPolicy(TC_INFORCE, createPersonalPolicySearchCriteria("Mike", "Sherman", TC_PERSONALAUTO), lossDate)
    if (policy == null) {
      return
    }
    var claimNumber = "235-53-425896"

    var claim = createPersonalAutoBaseClaim(claimNumber, policy, lossDate)
        .withDescription("Insured swerved to avoid an animal, struck claimant's car head-on")
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

  private function createClosedPersonalAutoClaimWithoutFinancials(bundle: Bundle) {
    var lossDate = Date.Now.addDays(-21)
    var policy = findPolicy(TC_INFORCE, createPersonalPolicySearchCriteria("Mike", "Sherman", TC_PERSONALAUTO), lossDate)
    if (policy == null) {
      return
    }
    var claimNumber = "235-53-425897"

    var claim = createPersonalAutoBaseClaim(claimNumber, policy, lossDate)
        .withDescription("Car hit into a pole")
        .closed()
        .withCloseDate(lossDate.addDays(7))
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

  private function createOpenHomeOwnersClaimWithFinancials(bundle: Bundle) {
    var lossDate = Date.Now.addDays(-28)
    var policy = findPolicy(TC_INFORCE, createPersonalPolicySearchCriteria("Mike", "Sherman", TC_HOPHOMEOWNERS), lossDate)
    if (policy == null) {
      return
    }
    var contact = policy.getContactByRole(TC_INSURED)
    var claimNumber = "235-53-425898"

    var claim = claimBuilder()
        .withClaimNumber(claimNumber)
        .withPolicy(policy)
        .withLossDate(lossDate)
        .withReportedDate(lossDate)
        .withAssignmentStatus(TC_ASSIGNED)
        .withAssignmentDate(lossDate.addDays(1))
        .withAssignedUser(findUserByUserName("wdufraine"))
        .withLossCause(TC_WATERDAMAGE)
        .withLossType(TC_PR)
        .withPropertyWaterDamage(new PropertyWaterDamageBuilder()
            .withWaterSource(TC_OTHER)
            .withHasWaterBeenTurnedOff(true))
        .withAssignedGroup(findGroupByName("Midwest Property A"))
        .withJurisdictionState(TC_IL)
        .withCoverageInQuestion(false)
        .withLOBCode(TC_HOPLINE)
        .withDescription("Flooding")
        .open()
        .withContactInRole(contact, TC_MAINCONTACT)
        .withContactInRole(contact, TC_REPORTER)
        .withLossLocation(policy.getAddresses().first())
        .create(bundle)

    var coverageToShare = claim.Policy.RiskUnits.singleWhere(\r -> r.RUNumber == 1).Coverages.singleWhere(\c -> c.Type == TC_HOPCOVA)

    var incident = new DwellingIncidentBuilder()
        .withDescription("heavy rains led to water leaking through the roof damaging walls, carpets and kitchen floor.")
        .onClaim(claim)
        .create(bundle)

    var exposure = new ExposureBuilder()
        .onClaim(claim)
        .withExposureType(TC_DWELLING)
        .withCoverage(coverageToShare)
        .withCoverageSubType(TC_HOPCOVA)
        .withIncident(incident)
        .withState(TC_OPEN)
        .withPrimaryCoverage(TC_HOPCOVA)
        .withClaimant(claim.Insured)
        .create(bundle)

    var transactionSet = new CheckSetBuilder()
        .withApprovalDate(lossDate.addDays(2))
        .withRequestingUser(findUserByUserName("aapplegate"))
        .withApprovalStatus(TC_APPROVED)
        .onClaim(claim)
        .create(bundle)

    var reserveLine = new ReserveLineBuilder()
        .withExposure(exposure)
        .withCostType(TC_CLAIMCOST)
        .withCostCategory(TC_PROPERTY_REPAIR)
        .withClaim(claim)
        .create(bundle)

    var check = new CheckBuilder()
        .onClaim(claim)
        .withIssueDate(lossDate.addDays(3))
        .withScheduledSendDate(lossDate.addDays(3))
        .withBankAccount(TC_DEFAULT)
        .onCheckSet(transactionSet)
        .withPayTo("John Albertson")
        .withStatus(TC_ISSUED)
        .withPaymentMethod(TC_CHECK)
        .withCheckNumber("11059")
        .withPayee(new CheckPayeeBuilder()
            .withPayee(contact)
            .withPayeeType(TC_CLAIMANT))
        .withType(TC_PRIMARY)
        .create(bundle)

    new ReserveBuilder()
        .withReserveLine(reserveLine)
        .onExposure(exposure)
        .onTransactionSet(transactionSet)
        .withCostType(TC_CLAIMCOST)
        .withCostCategory(TC_PROPERTY_REPAIR)
        .withCurrency(CurrencyUtil.getDefaultCurrency())
        .withStatus(TC_SUBMITTED)
        .onClaim(claim)
        .withTransToClaimExchangeRate(CurrencyUtil.isSingleCurrencyMode() ?
            null :
            Query.make(entity.ExchangeRate).compare("PriceCurrency", Equals, Currency.TC_USD)
                .compare("BaseCurrency", Equals, Currency.TC_USD)
                .select()
                .FirstResult)
        .withLineItem(new TransactionLineItemBuilder()
            .withComments("property damage")
            .withClaimForExAmount(0bd.ofDefaultCurrency())
            .withReportingAmount(2000bd.ofDefaultCurrency())
            .withClaimAmount(2000bd.ofDefaultCurrency())
            .withReservingAmount(2000bd.ofDefaultCurrency())
            .withTransactionAmount(2000bd.ofDefaultCurrency())
            .withLineCategory(TC_OTHER)
            .withReportingForExAmount(0bd.ofDefaultCurrency()))
        .create(bundle)

    new PaymentBuilder()
        .withReserveLine(reserveLine)
        .onTransactionSet(transactionSet)
        .withCostCategory(TC_BODY)
        .withCurrency(CurrencyUtil.getDefaultCurrency())
        .withStatus(TC_SUBMITTED)
        .withTransToClaimExchangeRate(CurrencyUtil.isSingleCurrencyMode() ?
            null :
            Query.make(entity.ExchangeRate).compare("PriceCurrency", Equals, Currency.TC_USD)
                .compare("BaseCurrency", Equals, Currency.TC_USD)
                .select()
                .FirstResult)
        .onCheck(check)
        .withPaymentType(TC_PARTIAL)
        .onExposure(exposure)
        .withCostType(TC_CLAIMCOST)
        .onClaim(claim)
        .withLineItem(new TransactionLineItemBuilder()
            .withComments("property damage")
            .withClaimForExAmount(0bd.ofDefaultCurrency())
            .withReportingAmount(1500bd.ofDefaultCurrency())
            .withClaimAmount(1500bd.ofDefaultCurrency())
            .withReservingAmount(1500bd.ofDefaultCurrency())
            .withTransactionAmount(1500bd.ofDefaultCurrency())
            .withLineCategory(TC_OTHER)
            .withReportingForExAmount(0bd.ofDefaultCurrency()))
        .create(bundle)

    new ClaimInfoBuilder()
        .withClaimNumber(claimNumber)
        .onClaim(claim)
        .create(bundle)
  }
}
