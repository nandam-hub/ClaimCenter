package gw.surepath.cc.configuration.activitymanagement.api

uses gw.api.database.Query
uses gw.api.database.Relop
uses gw.api.locale.DisplayKey
uses gw.api.util.DisplayableException
uses gw.api.webservice.exception.PermissionException
uses gw.api.webservice.exception.RequiredFieldException
uses gw.api.webservice.exception.BadIdentifierException
uses gw.surepath.cc.configuration.activitymanagement.dto.ActivityDTO
uses gw.surepath.suite.configuration.annotation.IncludeInDocumentation
uses gw.surepath.suite.integration.logging.StructuredLogger
uses gw.xml.ws.annotation.WsiPermissions
uses gw.xml.ws.annotation.WsiWebService

/**
 * Activity Management:
 * API provides functions for creating, updating, and removing CrossAppActPattern_SP in ClaimCenter.
 * API provides functions for creating activities within ClaimCenter.
 * API provides functions for retrieving activity information from ClaimCenter
 */
@WsiWebService("http://guidewire.com/cc/ws/gw/surepath/cc/configuration/activitymanagement/api/CCActivityAPI")
@Export
@IncludeInDocumentation
class CCActivityAPI {

  private static var _log = StructuredLogger.CONFIG.createSubcategoryLogger(DisplayKey.get("SP.ActivityManagement.Logger.SharedActivities"))

  /**
   * Create a new cross-application activity pattern in this application,
   * based upon an activity pattern created or updated in another application
   * @param patternCode the code of the activity pattern that should be translated to a cross-app activity
   * @param patternDisplayName the display name of the activity pattern that should be translated to a cross-app activity pattern
   * @param destApplication The application from which this request was generated, where the corresponding activity pattern resides
   */
  @Throws(DisplayableException, "A wrapper for any type of exception logged")
  @Param("patternCode", "The code of the activity pattern that should be translated to a cross-app activity pattern")
  @Param("patternDisplayName", "The display name of the activity pattern that should be translated to a cross-app activity pattern")
  @Param("destApplication", "The application from which this request was generated, where the corresponding activity pattern resides")
  @IncludeInDocumentation
  function createCrossAppActPattern(patternCode: String, patternDisplayName: String, destApplication: String) {
    try {
      if (not perm.System.createcrossappact_sp) {
        throw new PermissionException("Insufficient permissions to execute this action - requires the ${SystemPermissionType.TC_CREATECROSSAPPACT_SP} permission")
      }
      require(patternCode, "patternCode")
      require(patternDisplayName, "patternDisplayName")
      require(destApplication, "destApplication")
      var destApplicationTypecode = CrossAppActivityDest_SP.get(destApplication)
      var crossAppActivityPattern = findExistingCrossAppActPattern(patternCode, destApplicationTypecode)
      if (crossAppActivityPattern != null and not crossAppActivityPattern.Retired) {
        throw new BadIdentifierException("A cross-application activity pattern for PatternCode ${patternCode} and DestinationApplication ${destApplication} already exists!!")
      }

      gw.transaction.Transaction.runWithNewBundle(\bundle -> {
        var newCrossAppActivityPattern = new CrossAppActPattern_SP(bundle)
        newCrossAppActivityPattern.PatternCode = patternCode
        newCrossAppActivityPattern.PatternDisplayName = patternDisplayName
        newCrossAppActivityPattern.DestinationApplication = destApplicationTypecode
      })
    } catch (ex: Exception) {
      _log.error(ex.Message, CCActivityAPI#createCrossAppActPattern(String, String, String), ex)
      throw new DisplayableException(DisplayKey.get("SP.ActivityManagement.Error.DisplayableAPIError"))
    }
  }

  /**
   * Update an existing cross-application activity pattern in this application,
   * based upon an activity pattern updated in another application
   * @param patternCode the code of the activity pattern that should be translated to a cross-app activity pattern
   * @param patternDisplayName the display name of the activity pattern that should be translated to a cross-app activity pattern
   * @param destApplication The application from which this request was generated, where the corresponding activity pattern resides
   */
  @Throws(DisplayableException, "A wrapper for any type of exception logged")
  @Param("patternCode", "The code of the activity pattern that should be translated to a cross-app activity pattern")
  @Param("patternDisplayName", "The display name of the activity pattern that should be translated to a cross-app activity pattern")
  @Param("destApplication", "The application from which this request was generated, where the corresponding activity pattern resides")
  @IncludeInDocumentation
  function updateCrossAppActPattern(patternCode: String, patternDisplayName: String, destApplication: String) {
    try {
      if (not perm.System.editcrossappact_sp) {
        throw new PermissionException("Insufficient permissions to execute this action - requires the ${SystemPermissionType.TC_EDITCROSSAPPACT_SP} permission")
      }
      require(patternCode, "patternCode")
      require(patternDisplayName, "patternDisplayName")
      require(destApplication, "destApplication")
      var destApplicationTypecode = CrossAppActivityDest_SP.get(destApplication)
      var existingCrossAppActivityPattern = findExistingCrossAppActPattern(patternCode, destApplicationTypecode)
      if (existingCrossAppActivityPattern == null or existingCrossAppActivityPattern.Retired) {
        _log.debug("CrossAppActivityDest_SP does not exist:  ${patternCode} - ${destApplication}")
        throw new BadIdentifierException("A cross-application activity pattern for PatternCode ${patternCode} and DestinationApplication ${destApplication} does not exist!!")
      }

      gw.transaction.Transaction.runWithNewBundle(\bundle -> {
        existingCrossAppActivityPattern = bundle.add(existingCrossAppActivityPattern)
        existingCrossAppActivityPattern.PatternCode = patternCode
        existingCrossAppActivityPattern.PatternDisplayName = patternDisplayName
        existingCrossAppActivityPattern.DestinationApplication = CrossAppActivityDest_SP.get(destApplication)
      })
    } catch (ex: Exception) {
      _log.error(ex.Message, CCActivityAPI#updateCrossAppActPattern(String, String, String), ex)
      throw new DisplayableException(DisplayKey.get("SP.ActivityManagement.Error.DisplayableAPIError"))
    }
  }

  /**
   * Remove an existing cross-application activity pattern in this application,
   * based upon an activity pattern updated or removed in another application
   * @param patternCode the code of the activity pattern that should be translated to a cross-app activity pattern
   * @param destApplication The application from which this request was generated, where the corresponding activity pattern resides
   */
  @Throws(DisplayableException, "A wrapper for any type of exception logged")
  @Param("patternCode", "The code of the activity pattern that should be translated to a cross-app activity pattern")
  @Param("destApplication", "The application from which this request was generated, where the corresponding activity pattern resides")
  @IncludeInDocumentation
  function removeCrossAppActPattern(patternCode: String, destApplication: String) {
    try {
      if (not perm.System.deletecrossappact_sp) {
        throw new PermissionException("Insufficient permissions to execute this action - requires the ${SystemPermissionType.TC_DELETECROSSAPPACT_SP} permission")
      }
      require(patternCode, "patternCode")
      require(destApplication, "destApplication")
      var destApplicationTypecode = CrossAppActivityDest_SP.get(destApplication)
      var existingCrossAppActivityPattern = findExistingCrossAppActPattern(patternCode, destApplicationTypecode)
      if (existingCrossAppActivityPattern == null or existingCrossAppActivityPattern.Retired) {
        _log.debug("CrossAppActivityDest_SP does not exist:  ${patternCode} - ${destApplication}")
      } else {
        gw.transaction.Transaction.runWithNewBundle(\bundle -> {
          existingCrossAppActivityPattern = bundle.add(existingCrossAppActivityPattern)
          existingCrossAppActivityPattern.remove()
        })
      }
    } catch (ex: Exception) {
      _log.error(ex.Message, CCActivityAPI#removeCrossAppActPattern(java.lang.String, java.lang.String), ex)
      throw new DisplayableException(DisplayKey.get("SP.ActivityManagement.Error.DisplayableAPIError"))
    }
  }

  /**
   * Validate whether a corresponding activity pattern exists in this application for a remote cross-app activity pattern
   * @param patternCode the code of the activity pattern for which we are looking
   * @param patternDisplayName the subject of the activity pattern for which we are looking
   * @param sourceApplication the application from which this request orginated, where the corresponding cross-app activty pattern exists
   * @return a boolean value representing whether the pattern exists
   */
  @Throws(DisplayableException, "A wrapper for any type of exception logged")
  @Param("patternCode", "the code of the activity pattern for which we are looking")
  @Param("patternDisplayName", "the subject of the activity pattern for which we are looking")
  @Param("sourceApplication", "the application from which this request originated, where the corresponding cross-app activity pattern exists")
  @IncludeInDocumentation
  function correspondingActivityPatternExists(patternCode : String, patternDisplayName: String, sourceApplication : String): boolean {
    var existingActivityPattern: ActivityPattern
    try {
      if (not perm.System.actpatview) {
        throw new PermissionException("Insufficient permissions to execute this action - requires the ${SystemPermissionType.TC_ACTPATVIEW} permission")
      }
      require(patternCode, "patternCode")
      require(patternDisplayName, "patternDisplayName")
      require(sourceApplication, "sourceApplication")
      var sourceApplicationTypecode = CrossAppActivityDest_SP.get(sourceApplication)

      if (sourceApplicationTypecode == TC_CLAIMCENTER) {
        _log.warn("Invalid argument provided - source application of ClaimCenter provided when searching for a ClaimCenter activity pattern",
            CCActivityAPI#correspondingActivityPatternExists(String, String, String))
        return false
      }

      var queryActivityPattern = Query.make(ActivityPattern)
      queryActivityPattern
          .compare(ActivityPattern#Code, Equals, patternCode)
          .compare(ActivityPattern#Subject, Equals, patternDisplayName)
      if (sourceApplicationTypecode == TC_BILLINGCENTER) {
        queryActivityPattern.compare(ActivityPattern#BCGenerationAllowed_SP, Equals, true)
      } else if (sourceApplicationTypecode == TC_POLICYCENTER) {
        queryActivityPattern.compare(ActivityPattern#PCGenerationAllowed_SP, Equals, true)
      }

      existingActivityPattern = queryActivityPattern.select().AtMostOneRow
    } catch (ex: Exception) {
      _log.error(ex.Message, CCActivityAPI#correspondingActivityPatternExists(String, String, String), ex)
      throw new DisplayableException(DisplayKey.get("SP.ActivityManagement.Error.DisplayableAPIError"))
    }

    return existingActivityPattern != null
  }

  /**
   * Create an activity in this application based upon a found activity pattern in this application,
   * with the activity to be associated with a given claim
   * @param patternCode the code of the cross-application activity pattern that should be translated to an activity pattern
   * @param approvalIssue A free-entry string representing the approval issue for the activity, if any
   * @param description the description to be used for the activity if any
   * @param claimNumber The claim number for the claim that should receive this activity
   */
  @Throws(DisplayableException, "A wrapper for any type of exception logged")
  @Param("patternCode", "The code of the activity pattern that should be used to create this activity")
  @Param("approvalIssue", "A free-entry string representing the approval issue for the activity, if any")
  @Param("claimNumber", "The claim number for the claim that should receive this activity")
  @IncludeInDocumentation
  function createLocalActivityFromClaim(patternCode: String, approvalIssue: String, description: String, claimNumber: String) {
    try {
      if (not perm.System.actcreate) {
        throw new PermissionException("Insufficient permissions to execute this action - requires the ${SystemPermissionType.TC_ACTCREATE} permission")
      }
      require(patternCode, "patternCode")
      require(claimNumber, "claimNumber")
      var existingActivityPattern = findExistingActivityPattern(patternCode)
      if (existingActivityPattern == null or existingActivityPattern.Retired) {
        _log.debug("ActivityPattern does not exist: ${patternCode}")
        throw new BadIdentifierException("An activity pattern for PatternCode ${patternCode} does not exist!!")
      }
      var claim = findClaim(claimNumber)
      if (claim == null or claim.Retired) {
        _log.debug("Claim does not exist: ${claimNumber}")
        throw new BadIdentifierException("A claim with claim number ${claimNumber} does not exist!!")
      }

      gw.transaction.Transaction.runWithNewBundle(\bundle -> {
        existingActivityPattern.createLocalActivityFromClaim(claim, bundle, approvalIssue, description)
      })
    } catch (ex: Exception) {
      _log.error(ex.Message, CCActivityAPI#createLocalActivityFromClaim(String, String, String, String), ex)
      throw new DisplayableException(DisplayKey.get("SP.ActivityManagement.Error.DisplayableAPIError"))
    }
  }

  /**
   * Search for and retrieve any open activities in this application for a given user
   * @param username The user against whom we should search for open activities
   * @return an array of activity DTOs
   */
  @Throws(DisplayableException, "A wrapper for any type of exception logged")
  @Param("username", "The user against whom we should search for open activities")
  @IncludeInDocumentation
  function retrieveLocalOpenActivitiesForLoggedInUser(username: String): ActivityDTO[] {
    var activityDTOs: ActivityDTO[]
    try {
      if (not perm.System.actview) {
        throw new PermissionException("Insufficient permissions to execute this action - requires the ${SystemPermissionType.TC_ACTVIEW} permission")
      }
      require(username, "username")
      var userByUserName = Query.make(User)
          .join(User#Credential)
          .compare(Credential#UserName, Equals, username).select().AtMostOneRow
      if (userByUserName != null) {
        var activitiesForUser = Query.make(entity.Activity)
            .compare(entity.Activity#AssignedUser, Equals, userByUserName)
            .compare(entity.Activity#Status, Equals, TC_OPEN).select()
        activityDTOs = activitiesForUser.map(\elt -> ActivityDTO.valueOf(elt)).toTypedArray()
      }
    } catch (ex: Exception) {
      _log.error(ex.Message, CCActivityAPI#retrieveLocalOpenActivitiesForLoggedInUser(String), ex)
      throw new DisplayableException(DisplayKey.get("SP.ActivityManagement.Error.DisplayableAPIError"))
    }
    return activityDTOs
  }

  /**
   * Search for and retrieve any open activities in this application for a given Account
   * @param accountNumber The account against whom we should search for open activities
   * @return an array of activity DTOs
   */
  @Throws(DisplayableException, "A wrapper for any type of exception logged")
  @Param("username", "The user against whom we should search for open activities")
  @IncludeInDocumentation
  function retrieveLocalAccountActivities(accountNumber: String) : ActivityDTO[] {
    var activityDTOs: ActivityDTO[]
    try {
      if (not perm.System.actview) {
        throw new PermissionException("Insufficient permissions to execute this action - requires the ${SystemPermissionType.TC_ACTVIEW} permission")
      }
      require(accountNumber, "accountNumber")
      var account = findAccount(accountNumber)
      if (account != null) {
        var activitiesForAccount = Query.make(entity.Activity)
            .compare(entity.Activity#Status, Equals, TC_OPEN)
            .join(entity.Activity#Claim)
            .join(entity.Claim#Policy)
            .compare(entity.Policy#AccountNumber, Equals, account)
            .select()
        activityDTOs = activitiesForAccount.map(\elt -> ActivityDTO.valueOf(elt)).toTypedArray()
      }
    } catch (ex: Exception) {
      _log.error(ex.Message, CCActivityAPI#retrieveLocalAccountActivities(String), ex)
      throw new DisplayableException(DisplayKey.get("SP.ActivityManagement.Error.DisplayableAPIError"))
    }
    return activityDTOs
  }

  /**
   * Search for and retrieve any open activities in this application for a given Policy
   * @param policyNumber The policy number of the policy we should search for open activities
   * @return an array of activity DTOs
   */
  @Throws(DisplayableException, "A wrapper for any type of exception logged")
  @Param("policyNumber", "The policy number we should search for open activities")
  @IncludeInDocumentation
  function retrieveLocalPolicyActivities(policyNumber: String) : ActivityDTO[] {
    var activityDTOs: ActivityDTO[]
    try {
      if (not perm.System.actview) {
        throw new PermissionException("Insufficient permissions to execute this action - requires the ${SystemPermissionType.TC_ACTVIEW} permission")
      }
      require(policyNumber, "policyNumber")
      var policy = findPolicy(policyNumber)
      if (policy != null) {
        var activitiesForPolicy = Query.make(entity.Activity)
            .compare(entity.Activity#Status, Equals, TC_OPEN)
            .join(entity.Activity#Claim)
            .compare(entity.Claim#Policy, Equals, policy)
            .select()
        activityDTOs = activitiesForPolicy.map(\elt -> ActivityDTO.valueOf(elt)).toTypedArray()
      }
    } catch (ex: Exception) {
      _log.error(ex.Message, CCActivityAPI#retrieveLocalAccountActivities(String), ex)
      throw new DisplayableException(DisplayKey.get("SP.ActivityManagement.Error.DisplayableAPIError"))
    }
    return activityDTOs
  }

  /**
   * Finds the account for the speficied account number
   * @param accountNumber used to idenitfy the Account
   * @return Account associated with the specified accountNumber
   */
  @IncludeInDocumentation
  private function findAccount(accountNumber: String) : Account {
    var query = Query.make(Account)
    var foundAccount = query
        .compare(Account#AccountNumber, Relop.Equals, accountNumber)
        .select().AtMostOneRow
    return foundAccount
  }

  /**
   * Finds the policy for the specified policy number
   * @param policyNumber used to identify the Policy
   * @return Policy associated with the specified policyNumber
   */
  @IncludeInDocumentation
  private function findPolicy(policyNumber : String) : Policy {
    var policy = Query.make(Policy)
        .compare(Policy#PolicyNumber, Equals, policyNumber).select().AtMostOneRow
    return policy
  }

  /**
   * Finds the existing CrossAppActPattern_SP
   * @param patternCode used to identify the CrossAppActPattern_SP
   * @param destApplication The application where the activity will be created
   * @return CrossAppActPattern_SP for the specficied patternCode and destination application
   */
  @IncludeInDocumentation
  private function findExistingCrossAppActPattern(patternCode : String, destApplication : CrossAppActivityDest_SP) : CrossAppActPattern_SP {
    var queryCrossAppActPattern = Query.make(CrossAppActPattern_SP)
    var existingCrossAppActivityPattern = queryCrossAppActPattern
        .compare(CrossAppActPattern_SP#PatternCode, Equals, patternCode)
        .compare(CrossAppActPattern_SP#DestinationApplication, Equals, destApplication)
        .select().AtMostOneRow
    return existingCrossAppActivityPattern
  }

  /**
   *
   * @param patternCode used to identify the ActivityPattern
   * @return ActivityPattern based on the specified patternCode
   */
  @IncludeInDocumentation
  private function findExistingActivityPattern(patternCode: String) : ActivityPattern {
    var queryActivityPattern = Query.make(ActivityPattern)
    var existingActivityPattern = queryActivityPattern
        .compare(ActivityPattern#Code, Equals, patternCode)
        .select().AtMostOneRow
    return existingActivityPattern
  }

  /**
   * Finds a claim based on the claim number
   * @param claimNumber used to identify a Claim
   * @return Claim associated with the specified claimNumber
   */
  @IncludeInDocumentation
  private function findClaim(claimNumber: String) : Claim {
    var query = Query.make(Claim)
    var foundClaim = query
        .compare(Claim#ClaimNumber, Relop.Equals, claimNumber)
        .select().AtMostOneRow
    return foundClaim
  }

  /**
   * Function used to validate the required fields are received.
   * @param value
   * @param parameterName
   */
  @IncludeInDocumentation
  private function require(value: Object, parameterName: String) {
    if (value == null) {
      throw new RequiredFieldException(DisplayKey.get("Webservice.Error.MissingRequiredField", parameterName))
    }
  }

}