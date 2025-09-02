package gw.surepath.cc.configuration.activitymanagement.enhancement

uses gw.pl.persistence.core.Bundle
uses gw.surepath.cc.configuration.activitymanagement.util.AssignActivitiesUtil
uses gw.surepath.suite.configuration.annotation.IncludeInDocumentation

/**
 * Activity Management: Additional functions used to enhance ActivityPattern for this feature
 */
@IncludeInDocumentation
enhancement ActivityPatternEnhancement : ActivityPattern {

  /**
   * Creates an activity associated with a claim
   * @param claim
   * @param bundle
   * @param approvalIssue
   * @param description
   * @return Activity
   */
  @IncludeInDocumentation
  function createLocalActivityFromClaim(claim: Claim, bundle: Bundle, approvalIssue: String, description: String): Activity {
    var targetDate = calculateTargetDateGivenAnchorDate(Date.CurrentDate)
    var escalationDate = calculateEscalationDateGivenAnchorDate(Date.CurrentDate)
    var activity = new Activity(bundle)
    activity.setActivityPattern(this, targetDate, escalationDate)
    activity.Claim = claim
    activity.ApprovalIssue = approvalIssue
    activity.Description = description ?: activity.ActivityPattern.Description
    activity.assignToClaimOwner()
    AssignActivitiesUtil.maybeAssignToBackUpUser(activity)
    return activity
  }

  private function calculateTargetDateGivenAnchorDate(anchorDate: Date): Date {
    if (this.TargetIncludeDays == IncludeDaysType.TC_ELAPSED) {
      return anchorDate.addDays(this.TargetDays ?: 0).addHours(this.TargetHours ?: 0)
    } else {
      return anchorDate.addBusinessDays(this.TargetDays ?: 0, this.TargetBusCalTag, null)
          .addBusinessHours(this.TargetHours ?: 0, this.TargetBusCalTag, null)
    }
  }

  private function calculateEscalationDateGivenAnchorDate(anchorDate: Date): Date {
    if (this.EscalationInclDays == IncludeDaysType.TC_ELAPSED) {
      return anchorDate.addDays(this.EscalationDays ?: 0).addHours(this.EscalationHours ?: 0)
    } else {
      return anchorDate.addBusinessDays(this.EscalationDays ?: 0, this.EscalationBusCalTag, null)
          .addBusinessHours(this.EscalationHours ?: 0, this.EscalationBusCalTag, null)
    }
  }
}