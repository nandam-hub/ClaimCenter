package gw.surepath.cc.configuration.activitymanagement.api

uses gw.api.locale.DisplayKey
uses gw.api.util.DisplayableException
uses gw.surepath.cc.configuration.activitymanagement.api.bcactivityapi.bcactivityapi.BCActivityAPI
uses gw.surepath.cc.configuration.activitymanagement.api.pcactivityapi.pcactivityapi.PCActivityAPI
uses gw.surepath.cc.configuration.activitymanagement.dto.RemoteActivityDTO
uses gw.surepath.suite.configuration.annotation.IncludeInDocumentation

/**
 * Activity Management: Utility class used for creating activities in a remote application.
 * Contains functions used for maintaining CrossAppActPattern_SP
 */
@IncludeInDocumentation
class ActivityAPIUtil {

  /**
   * Handle a newly created activity pattern - create in the destination application(s)
   * @param patternCode the activity pattern code
   * @param patternDisplayName the activity pattern subject
   * @param bcAllowed whether we should create a cross-application activity pattern in BC
   * @param pcAllowed whether we should create a cross-application activity pattern in PC
   */
  @IncludeInDocumentation
  function handleCreatedActivityPattern(patternCode: String, patternDisplayName: String,
                                        bcAllowed: boolean, pcAllowed: boolean) {
    if (bcAllowed) {
      createRemoteBCCrossApplicationActivityPattern(patternCode, patternDisplayName)
    }
    if (pcAllowed) {
      createRemotePCCrossApplicationActivityPattern(patternCode, patternDisplayName)
    }
  }

  /**
   * Handle an updated activity pattern - either create, update, or remove in the destination application(s)
   * @param patternCode the activity pattern code
   * @param patternDisplayName the activity pattern subject
   * @param bcAllowed whether we should have a cross-application activity pattern in BC
   * @param pcAllowed whether we should have a cross-application activity pattern in PC
   */
  @IncludeInDocumentation
  function handleUpdatedActivityPattern(patternCode: String, patternDisplayName: String,
                                        bcAllowed: boolean, pcAllowed: boolean) {
    if (bcAllowed) {
      updateRemoteBCCrossApplicationActivityPattern(patternCode, patternDisplayName)
    } else if (pcAllowed) {
      updateRemotePCCrossApplicationActivityPattern(patternCode, patternDisplayName)
    }
  }

  /**
   * Handle a removed activity pattern - remove in the destination application(s)
   * @param patternCode the activity pattern code
   * @param removeFromBC whether we should call to BC to remove
   * @param removeFromPC whether we should call to PC to remove
   */
  @IncludeInDocumentation
  function handleRemovedActivityPattern(patternCode: String, removeFromBC: boolean, removeFromPC: boolean) {
    if (removeFromBC) {
      removeRemoteBCCrossApplicationActivityPattern(patternCode)
    }
    if (removeFromPC) {
      removeRemotePCCrossApplicationActivityPattern(patternCode)
    }
  }

  /**
   * Handles creating an activity in a remote application
   * @param remoteActivityDTO
   */
  @IncludeInDocumentation
  function handleCreatedActivityToDestinationApplication(remoteActivityDTO: RemoteActivityDTO) {
    if (remoteActivityDTO.DestinationApplication == CrossAppActivityDest_SP.TC_BILLINGCENTER) {
      if (remoteActivityDTO.TermNumber != null and remoteActivityDTO.PolicyNumber != null) {
        handleCreatedPolicyPeriodActivityToBillingCenter(remoteActivityDTO.PatternCode, remoteActivityDTO.ApprovalIssue,
            remoteActivityDTO.Description, remoteActivityDTO.PolicyNumber, remoteActivityDTO.TermNumber)
      } else if (remoteActivityDTO.AccountNumber != null) {
        handleCreatedAccountActivityToBillingCenter(remoteActivityDTO.PatternCode, remoteActivityDTO.ApprovalIssue,
            remoteActivityDTO.Description, remoteActivityDTO.AccountNumber)
      } else {
        throw new DisplayableException(DisplayKey.get("SP.ActivityManagement.CrossSuiteActivities.Error.BC.IncompleteData"))
      }
    } else if (remoteActivityDTO.DestinationApplication == CrossAppActivityDest_SP.TC_POLICYCENTER) {
      if (remoteActivityDTO.AsOfDate != null and remoteActivityDTO.PolicyNumber != null) {
        handleCreatedPolicyPeriodActivityToPolicyCenter(remoteActivityDTO.PatternCode, remoteActivityDTO.ApprovalIssue,
            remoteActivityDTO.Description, remoteActivityDTO.PolicyNumber, remoteActivityDTO.AsOfDate)
      } else if (remoteActivityDTO.PolicyNumber != null) {
        handleCreatedPolicyActivityToPolicyCenter(remoteActivityDTO.PatternCode, remoteActivityDTO.ApprovalIssue,
            remoteActivityDTO.Description, remoteActivityDTO.PolicyNumber)
      } else if (remoteActivityDTO.AccountNumber != null) {
        handleCreatedAccountActivityToPolicyCenter(remoteActivityDTO.PatternCode, remoteActivityDTO.ApprovalIssue,
            remoteActivityDTO.Description, remoteActivityDTO.AccountNumber)
      } else {
        throw new DisplayableException(DisplayKey.get("SP.ActivityManagement.CrossSuiteActivities.Error.PC.IncompleteData"))
      }
    } else {
      throw new DisplayableException(DisplayKey.get("SP.ActivityManagement.CrossSuiteActivities.Error.InvalidDestination"))
    }
  }

  private function handleCreatedAccountActivityToBillingCenter(patternCode: String, approvalIssue: String,
                                                               description: String, accountNumber: String) {
    new BCActivityAPI().createLocalActivityFromAccount(patternCode, approvalIssue, description, accountNumber)
  }

  private function handleCreatedPolicyPeriodActivityToBillingCenter(patternCode: String, approvalIssue: String,
                                                                    description: String, policyNumber: String, termNumber: String) {
    new BCActivityAPI().createLocalActivityFromPolicyPeriod(patternCode, approvalIssue, description, policyNumber, termNumber)
  }

  private function handleCreatedAccountActivityToPolicyCenter(patternCode: String, approvalIssue: String,
                                                              description: String, accountNumber: String) {
    new PCActivityAPI().createLocalActivityFromAccount(patternCode, approvalIssue, description, accountNumber)
  }

  private function handleCreatedPolicyActivityToPolicyCenter(patternCode: String, approvalIssue: String,
                                                             description: String, policyNumber: String) {
    new PCActivityAPI().createLocalActivityFromPolicy(patternCode, approvalIssue, description, policyNumber)
  }

  private function handleCreatedPolicyPeriodActivityToPolicyCenter(patternCode: String, approvalIssue: String,
                                                                   description: String, policyNumber: String, asOfDate: Date) {
    new PCActivityAPI().createLocalActivityFromPolicyPeriod(patternCode, approvalIssue, description, policyNumber, asOfDate)
  }

  private function createRemoteBCCrossApplicationActivityPattern(patternCode : String, patternDisplayName : String) {
    var destApplicationCode = typekey.CrossAppActivityDest_SP.TC_CLAIMCENTER.Code
    new BCActivityAPI().createCrossAppActPattern(patternCode, patternDisplayName, destApplicationCode)
  }

  private function updateRemoteBCCrossApplicationActivityPattern(patternCode : String, patternDisplayName : String) {
    var destApplicationCode = typekey.CrossAppActivityDest_SP.TC_CLAIMCENTER.Code
    new BCActivityAPI().updateCrossAppActPattern(patternCode, patternDisplayName, destApplicationCode)
  }

  private function removeRemoteBCCrossApplicationActivityPattern(patternCode : String) {
    var destApplicationCode = typekey.CrossAppActivityDest_SP.TC_CLAIMCENTER.Code
    new BCActivityAPI().removeCrossAppActPattern(patternCode, destApplicationCode)
  }

  private function createRemotePCCrossApplicationActivityPattern(patternCode : String, patternDisplayName : String) {
    var destApplicationCode = typekey.CrossAppActivityDest_SP.TC_CLAIMCENTER.Code
    new PCActivityAPI().createCrossAppActPattern(patternCode, patternDisplayName, destApplicationCode)
  }

  private function updateRemotePCCrossApplicationActivityPattern(patternCode : String, patternDisplayName : String) {
    var destApplicationCode = typekey.CrossAppActivityDest_SP.TC_CLAIMCENTER.Code
    new PCActivityAPI().updateCrossAppActPattern(patternCode, patternDisplayName, destApplicationCode)
  }

  private function removeRemotePCCrossApplicationActivityPattern(patternCode : String) {
    var destApplicationCode = typekey.CrossAppActivityDest_SP.TC_CLAIMCENTER.Code
    new PCActivityAPI().removeCrossAppActPattern(patternCode, destApplicationCode)
  }

}