package gw.sampledata

uses gw.api.suite.GuidewireSuiteUtil
uses gw.pl.persistence.core.Bundle

@Export
class SampleClaims extends SampleDataBase {

  construct(inCache : SampleDataCache) {
    super(inCache)
  }

  override property get Description() : String {
    return "Contacts, Policies, Claims, Exposures, Notes, ClaimContacts, Activities and Financials"
  }

  override function testSampleData(bundle : Bundle) {
    new SamplePersonalAutoClaims(Cache).demoSampleData(bundle)
    new SampleCommercialPropertyClaims(Cache).demoSampleData(bundle)
    new SampleWorkersCompClaims(Cache).demoSampleData(bundle)
    new SampleCommercialAutoClaims(Cache).demoSampleData(bundle)
    new SampleGeneralLiabilityClaims(Cache).demoSampleData(bundle)
    new SampleTravelClaims(Cache).demoSampleData(bundle)
    new SampleHOPClaimWithHO2Policy(Cache).demoSampleData(bundle)
    new SampleHOPClaimWithHO4Policy(Cache).demoSampleData(bundle)
    new SampleHOPClaimWithHO5Policy(Cache).demoSampleData(bundle)
    new SampleHOPClaimWithHO6Policy(Cache).demoSampleData(bundle)
  }

  override function demoSampleData(bundle : Bundle) {
    super.demoSampleData(bundle)
    new SampleClaimsForPCIntegration(Cache).demoSampleData(bundle)
    if (PCIntegrationEnabled) {
      new SampleClaimsForExistingPoliciesInPCForPerson(Cache).demoSampleData(bundle)
      new SampleClaimsForExistingPoliciesInPCForCompany(Cache).demoSampleData(bundle)
    }
  }

  private property get PCIntegrationEnabled(): boolean {
    return GuidewireSuiteUtil.getProductInfo("pc") != null
  }
}