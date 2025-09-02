package gw.rest.ext.cc.claim.timeline

uses gw.api.database.Query
uses gw.api.database.Relop
uses gw.api.json.JsonConfigAccess
uses gw.api.json.mapping.TransformResult
uses gw.rest.core.cc.claim.v1.claims.ClaimApiHandlerBase
uses gw.surepath.suite.integration.logging.StructuredLogger

@Export
class ClaimTimelineApiExtHandler extends ClaimApiHandlerBase {
  private static var _log = StructuredLogger.INTEGRATION
  public function getClaimTimelines(claimID : String) : TransformResult {
    var timeLineQuery = Query.make(Timeline_SP)
    timeLineQuery.join(Timeline_SP#Claim).compare(Claim#PublicID, Relop .Equals, claimID)
    var results = timeLineQuery.select()
    var timelines = results.AtMostOneRow
    if(timelines != null){
      if(_log.DebugEnabled) {
        _log.debug("Found the claimtimelines for claim")
      }
      var jsonMapper = JsonConfigAccess.getMapper("ext.claim.v1.claim_timeline_ext-1.0", "TimeLine_SP")
      var transformResult = jsonMapper.transformObject(timelines)
      if(_log.DebugEnabled) {
        _log.debug("Transformed the claimtimelines for claim")
      }
      _log.info("successfully transformed the claim timelines to response json!")
      return transformResult
    }
    return null
  }
}