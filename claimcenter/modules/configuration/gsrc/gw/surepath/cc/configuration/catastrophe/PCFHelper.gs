package gw.surepath.cc.configuration.catastrophe

uses gw.api.financials.FinancialsCalculationUtil
uses gw.api.financials.FinancialsCalculations
uses gw.api.financials.FinancialsCalculator
uses gw.api.locale.DisplayKey
uses gw.surepath.cc.configuration.catastrophe.claim.ClaimCreator
uses gw.surepath.cc.configuration.catastrophe.policysearch.PolicyFinderUtil
uses gw.api.heatmap.CatastropheSearchCriteria.PolicyLocationSearchResult

uses java.lang.Throwable
uses java.util.Date

uses gw.surepath.cc.configuration.catastrophe.util.CatastropheProperties
uses gw.surepath.suite.configuration.annotation.IncludeInDocumentation
uses gw.surepath.suite.integration.logging.StructuredLogger
uses org.slf4j.LoggerFactory

/**
 * Code used in the Catastrophe PCF files
 */
@IncludeInDocumentation
@Export
class PCFHelper {

  private static var _log = StructuredLogger.CONFIG.createSubcategoryLogger(DisplayKey.get("SP.Catastrophe.Logger"))
  var _policyFinder = new PolicyFinderUtil()

  /**
   * Creates a claim for each checked policy location summary
   * Afterwards, puts together a message containing the claim numbers
   * and displays it on the UI.
   */
  @IncludeInDocumentation
  @Param("aCatastrophe", "A catastrophe already persisted in ClaimCenter")
  @Param("policyLocations", "Selected policy locations from the Catastrophe Claim Search screen.")
  public function createClaims(aCatastrophe: Catastrophe, policyLocations: PolicyLocationSearchResult[]) {
    if (not CatastropheProperties.INSTANCE.FeatureEnabled) {
      throw new IllegalAccessException(DisplayKey.get("SP.Catastrophe.Error.FeatureDisabled"))
    }
    var createdClaimCount = 0
    var results = ""
    if (aCatastrophe.CatClaimTemplateSettings_SP == null) {
      throw new gw.api.util.DisplayableException("No template claim settings have been defined for this catastrophe: " + aCatastrophe.Name)
    }
    for (eachLocation in policyLocations) {
      var policyNumber = eachLocation.PolicyNumber
      _log.info("Creating a claim for policy location summary ID: " + eachLocation.PolicyLocationSummaryID )
      // Create a quick-setup template claim
      try {
        var thePolicy = getPolicy(eachLocation)
        if (thePolicy == null) {
          throw new gw.api.util.DisplayableException("No policy found with policy number: " + policyNumber)
        }
        var newClaimNumber = ClaimCreator.createCatastropheTemplateClaim(thePolicy, aCatastrophe)
        var exposureWarnings: String = null
        // Update the policy location summary join entity.
        gw.transaction.Transaction.runWithNewBundle(\bundle -> {
          var c = Claim.finder.findClaimByClaimNumber(newClaimNumber)
          exposureWarnings = checkExposureReservesAgainstCoverageLimit(c)
          bundle.add(c)
          _log.info("Updating policy location summary for claim #: " + c.ClaimNumber)
          gw.claim.catastrophe.CatastropheMethodsImpl.updatePolicyLocationSummaryJoin(c, c.PolicyLocationSummaryJoin)
        })
        createdClaimCount++
        // Prepare the log entry which appears on the screen
        results += "     " + newClaimNumber + "  (Policy: " + policyNumber + " " + eachLocation.InsuredName + ")\n"
        // Tack on the warnings regarding reserves (on exposures) which were not properly applied.
        if (exposureWarnings != "") {
          results += "Warning: Errors encountered during creation of exposures w/reserves.\n"
          results += exposureWarnings
        }
      } catch (e: Throwable) {
        results += "        " + e.Message + "\n"
      }
    }
    displayResultsInUI(results, createdClaimCount)
  }

  /**
   * Retrieves a policy from the external policy system using policy location summary information.
   */
  @Param("aPolicyLocation", "Policy location search results from the Catastrophe Claim Search screen")
  @Returns("A policy with matching risk units selected")
  private function getPolicy(aPolicyLocation: PolicyLocationSearchResult): Policy {
    var policyNumber = aPolicyLocation.PolicyNumber
    var addressLine1 = aPolicyLocation.AddressLine1
    var city = aPolicyLocation.City
    var effectiveDate = Date.CurrentDate
    var aPolicy = _policyFinder.findPolicyFromPolicyLocationSummary(policyNumber, addressLine1, city, effectiveDate)
    return aPolicy
  }

  /**
   * Displays a list of newly created template catastrophe claim numbers (along with matching policies)
   */
  private function displayResultsInUI(results: String, newClaimCount: int) {
    // Strip the last comma from the list of claim numbers
    results = results.substring(0, results.length - 1)
    var result = new gw.api.web.UIMessageList()
    if (newClaimCount > 0) {
      result.add(gw.api.web.UIMessage.info("Created new claims: \n" + results))
    } else {
      result.add(gw.api.web.UIMessage.info("Failed to create new claims: \n" + results))
    }
    result.display()
  }

   /**
    * If the logged in user does not have sufficient authority limits to cover the exposure / reserves amount
    * (which is some percentage of a commercial property coverage limit)
    * then the reserve is not actually created. Therefore we should check the reserves on exposures
    * against the desired reserves amount and raise a warning if numbers don't match.
    */
  private function checkExposureReservesAgainstCoverageLimit(newClaim: Claim): String {
    var exceptionMessage = ""
    var catTemplate = newClaim.Catastrophe.CatClaimTemplateSettings_SP
    // Iterate through exposures
    for (eachExposure in newClaim.Exposures) {
      var associatedExposureRule = catTemplate.ExposureRules.where(\c -> c.CoverageType == eachExposure.Coverage.Type and c.CoverageSubtype == c.CoverageSubtype)[0]
      var reservePercent = associatedExposureRule.ReservePercent
      var coverageLimit = eachExposure.Coverage.IncidentLimit
      var targetReserveAmount = coverageLimit * associatedExposureRule.ReservePercent / 100
      var actualExposureReserves = FinancialsCalculations.AvailableReserves.withExposure(eachExposure).Amount
      if (targetReserveAmount != actualExposureReserves) {
        // Was not able to setup initial reserves (possibly due to authority limits)
        exceptionMessage += "Unable to set reserves for exposure #" + eachExposure.ClaimOrder + ". "
        exceptionMessage += "Reason: Insufficient authority limits.\n"
        exceptionMessage += "Cat claim template defines initial exposure reserves at " + reservePercent + "% ("
        exceptionMessage += targetReserveAmount.toString() + ") which exceeds user's authority limits.\n"
      }
    }
    return exceptionMessage
  }
}
