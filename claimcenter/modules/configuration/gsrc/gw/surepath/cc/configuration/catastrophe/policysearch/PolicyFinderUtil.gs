package gw.surepath.cc.configuration.catastrophe.policysearch

uses com.guidewire.cc.system.dependency.CCDependencies
uses gw.api.database.IQueryBeanResult

uses java.util.Date

uses gw.api.locale.DisplayKey
uses gw.surepath.cc.configuration.catastrophe.util.CatastropheProperties
uses gw.surepath.suite.configuration.annotation.IncludeInDocumentation
uses gw.surepath.suite.integration.logging.StructuredLogger
uses org.slf4j.LoggerFactory

/**
 * This class queries the policy system to search / retrieve a policy (and risk units) based on policy location
 * info retrieved in the Catastrophe / Policy Location download batch.
 */
@IncludeInDocumentation
@Export
class PolicyFinderUtil {
  private static var _log = StructuredLogger.CONFIG.createSubcategoryLogger(DisplayKey.get("SP.Catastrophe.Logger"))
  /**
   * Search for the policy in the Policy System. 
   */
  @IncludeInDocumentation
  @Param("policyNumber", "The policy number")
  @Param("addressLine1", "Policy Location Address Line 1")
  @Param("city", "Policy Location City")
  @Param("effectiveDate", "Effective Date")
  @Returns("A policy with location risk units for the properties (houses, buildings, etc.)")
  public function findPolicyFromPolicyLocationSummary(policyNumber: String, addressLine1: String, city: String, effectiveDate: Date): Policy {
    _log.info("Entering method findPolicy()...")
    if (not CatastropheProperties.INSTANCE.FeatureEnabled) {
      throw new IllegalAccessException(DisplayKey.get("SP.Catastrophe.Error.FeatureDisabled"))
    }

    // Set the search criteria for policy summary query
    var searchCriteria = new PolicySearchCriteria()
    searchCriteria.PolicyNumber = policyNumber
    searchCriteria.LossDate = effectiveDate
    var foundSummaries: IQueryBeanResult<PolicySummary> = null
    try {
      foundSummaries = searchCriteria.performSearch()
    } catch (e) {
      throw "Unable to connect to external policy system: " + e
    }

    // Check search results. We should only have <1> unique policy summary (for a policy number / effective date)
    if (foundSummaries.Count == 0) {
      // No policy found
      throw "Policy #" + policyNumber + " not found in external policy system."
    } else if (foundSummaries.Count > 1) {
      // Duplicate policy summaries found. This is not good either.
      throw "Duplicate policy summaries found for policy # " + policyNumber
    }
    var foundSummary = foundSummaries.getFirstResult()

    // Select risk units that share the same address as our policy location.
    selectMatchingRiskUnits(foundSummary, addressLine1, city)

    // Policy summary and risk units confirmed. Now let's retrieve the entire policy.
    var foundPolicy: Policy = null
    try {
      foundPolicy = foundSummary.retrievePolicy()
    } catch (e) {
      // Error connecting to external policy system
      throw "Unable to retrieve policy for policy # " + policyNumber + "\n" + e
    }

    // Confirm that we retrieved a real policy    
    if (foundPolicy == null) {
      throw "No policy found for policy #" + policyNumber
    }

    _log.info("Exiting method findPolicy() with return value: " + foundPolicy)
    return foundPolicy
  }

  /**
   * Select all properties on the policy with matching addresses
   */
  private function selectMatchingRiskUnits(summary: PolicySummary, addressLine1: String, city: String) {
    for (eachProperty in summary.getProperties()) {
      if (eachProperty.AddressLine1 == addressLine1 and eachProperty.City == city) {
        eachProperty.Selected = true
      }
    }
  }
}
