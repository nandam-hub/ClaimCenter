package gw.surepath.cc.configuration.timeline.creation.ui

uses gw.api.database.IQueryBeanResult
uses gw.api.database.Query
uses gw.entity.TypeKey
uses gw.surepath.suite.configuration.annotation.IncludeInDocumentation
uses org.json.JSONObject

/**
 * This has functions to retrieve the claim from the claim number based opn the claim number
 * and also retrieve the time line event types for the TimelineEvent_SP
 */
@IncludeInDocumentation
class TimelineUIUtil {

  static public function typekeyToJSONObject(typekey : TypeKey)  : JSONObject {
    var typekeyJSON = new JSONObject()
    typekeyJSON.put("Code", typekey.Code)
    typekeyJSON.put("DisplayName", typekey.DisplayName)
    typekeyJSON.put("Priority", typekey.Priority)
    return typekeyJSON
  }

  /**
   * This function is used to retrieve the claim for the provided claim number
   * @param claimNumber
   * @return Claim
   */
  @IncludeInDocumentation
  static function retrieveClaimFromClaimNumber(claimNumber: String): Claim {
    var claimQuery = Query.make(entity.Claim)
        claimQuery.compare(entity.Claim#ClaimNumber, Equals, claimNumber)
    var theClaim = claimQuery.select().FirstResult
    return theClaim
  }

  /**
   * This function is used to retrieve the timeline event types
   * @return IQueryBeanResult TimelineEvent_SP
   */
@IncludeInDocumentation

  static function retrieveTimelineEventTypes(): IQueryBeanResult<TimelineEvent_SP> {
    var eventTypeQuery = Query.make(entity.TimelineEvent_SP)
    var results = eventTypeQuery.select()
    return results
  }
}
