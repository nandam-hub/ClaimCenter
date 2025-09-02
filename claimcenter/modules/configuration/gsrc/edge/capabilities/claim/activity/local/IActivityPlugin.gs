package edge.capabilities.claim.activity.local

uses edge.capabilities.claim.activity.dto.ActivityDTO
uses edge.capabilities.claim.activity.dto.ActivitySearchDTO
uses edge.capabilities.claim.activity.dto.ActivitySummaryDTO

/**
 * Claim activity manipulation plugin.
 */
interface IActivityPlugin {
  /**
   * Returns activity summaries available to the given user.
   */
  public function getSummaries(request : ActivitySearchDTO) : ActivitySummaryDTO[]


  /**
   * Returns activity summaries for the claim.
   */
  public function getClaimSummaries(claim : Claim) : ActivitySummaryDTO[]


  /**
   * Converts activity into the DTO
   */
  public function toDTO(activity : Activity) : ActivityDTO


  /**
   * Retrieves an activity by its id.
   */
  public function getActivity(activityId : String) : Activity
}
