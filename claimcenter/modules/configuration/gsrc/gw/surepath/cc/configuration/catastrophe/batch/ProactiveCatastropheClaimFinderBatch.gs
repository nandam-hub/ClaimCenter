package gw.surepath.cc.configuration.catastrophe.batch

uses gw.api.database.IQueryBeanResult
uses gw.api.database.Query
uses gw.api.locale.DisplayKey
uses gw.api.system.CCConfigParameters
uses gw.api.system.PLLoggerCategory
uses gw.surepath.cc.configuration.catastrophe.util.CatastropheProperties
uses gw.surepath.suite.configuration.annotation.IncludeInDocumentation
uses gw.util.CatastropheClaimFinderBatch

/**
 * This class overrides the OOTB CatastropheClaimFinderBatch to make a few performance improvements...
 * ...and to associate the claims to the actual catastrophe records via FK in the same transaction bundle as creating an activity
 * We did this in a separate class to avoid making material changes to the OOTB batch process
 * The only changes in the OOTB batch process class are to make certain artifacts protected instead of private
 */
@IncludeInDocumentation
class ProactiveCatastropheClaimFinderBatch extends CatastropheClaimFinderBatch {

  construct() {
    super()
  }

  /**
   * Use logic from superclass if Proactive Catastrophe Management feature is not enabled
   * Otherwise, supplement that logic by setting the cat property on the claim and creating the activity in the same bundle
   */
  @IncludeInDocumentation
  override function doWork() {
    if (not CatastropheProperties.INSTANCE.FeatureEnabled) {
      super.doWork()
    } else {
      var catastrophes = findMarkedCatastrophes()
      var historyDescription = ""
      var catClaims : IQueryBeanResult<Claim>

      for (catastrophe in catastrophes) {
        var claimsProcessedCount = 0
        try {
          if(_catActivityPattern == null) {
            throw new UnsupportedOperationException(DisplayKey.get("Web.InternalTools.BatchProcess.CatastropheClaimFinder.ActivityDoesNotExist", _catActivityPattern.Subject))
          }

          catClaims = catastrophe.findClaimsByCatastropheZone()
          var catClaimsCount = catClaims.Count
          var catClaimsIterator = catClaims.iterator()
          while (catClaimsIterator.hasNext()) {
            var claim = catClaimsIterator.next()
            gw.transaction.Transaction.runWithNewBundle(\ bundle -> {
              claim = bundle.add(claim)
              // creates a 'review for catastrophe' activity if one does not already exist
              if (not claim.Activities.hasMatch(\elt1 -> elt1.ActivityPattern == _catActivityPattern)) {
                createReviewForCatastropheActivity(claim)
              }
              claim.Catastrophe = catastrophe
            }, SYSTEM_USER_NAME)
            claimsProcessedCount++
            // does not process any claims over the result limit. the result limit is based off the MaxCatastropheClaimFinderSearchResults config parameter.
            if (catClaimsCount > MAX_CLAIM_RESULTS and claimsProcessedCount >= MAX_CLAIM_RESULTS) {
              PLLoggerCategory.SERVER_BATCHPROCESS.info(DisplayKey.get("Web.InternalTools.BatchProcess.CatastropheClaimFinder.ExceedsNumClaimResults", MAX_CLAIM_RESULTS, claimsProcessedCount, catClaimsCount))
              break
            }
          }
          historyDescription = getHistoryDescription(claimsProcessedCount, catClaimsCount)
        } catch (e : Exception) {
          historyDescription = DisplayKey.get("Web.InternalTools.BatchProcess.CatastropheClaimFinder.ErrorOccurred") + e.Message
        }
        createAndAddCatastropheClaimsHistory(catastrophe, historyDescription)
        if (catClaims.Count < MAX_CLAIM_RESULTS) {
          clearScheduleBatch(catastrophe)
        }
      }
    }
  }

  /**
   * Override this function to not instantiate a new bundle
   * We want to execute in the same bundle with other actions in the doWork method
   * @param claim
   */
  @IncludeInDocumentation
  override protected function createReviewForCatastropheActivity(claim: Claim) {
    var activity = claim.createActivityFromPattern(null, _catActivityPattern);
    activity.Description = DisplayKey.get("Web.InternalTools.BatchProcess.CatastropheClaimFinder.ReviewMatchesOnClaim")
  }

  /**
   * Override this function to retrieve the latest version of the catastrophe from the database
   * We need to do this because an intervening transaction bundle will already have updated the catastrophe
   * @param catastrophe the catastrophe to be refreshed from the database
   */
  @IncludeInDocumentation
  override protected function clearScheduleBatch(catastrophe: Catastrophe) {
    gw.transaction.Transaction.runWithNewBundle( \ bundle -> {
      var cat = Query.make(entity.Catastrophe)
          .compare(entity.Catastrophe#PublicID, Equals, catastrophe.PublicID)
          .select().AtMostOneRow
      cat = bundle.add(cat)
      cat.ScheduleBatch = false
    }, SYSTEM_USER_NAME)
  }

}