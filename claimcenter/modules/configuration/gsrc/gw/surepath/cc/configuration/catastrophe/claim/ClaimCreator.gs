package gw.surepath.cc.configuration.catastrophe.claim

uses com.google.common.collect.ImmutableMap
uses gw.api.locale.DisplayKey
uses gw.surepath.cc.configuration.catastrophe.util.CatastropheProperties
uses gw.surepath.suite.configuration.annotation.IncludeInDocumentation
uses gw.surepath.suite.integration.logging.StructuredLogger

/**
 * Class used to support creating a claim for a given policy, associated with a catastrophe, and using a provided Cat Claim Template
 */
@IncludeInDocumentation
@Export
class ClaimCreator {
  private static var _log = StructuredLogger.CONFIG.createSubcategoryLogger(DisplayKey.get("SP.Catastrophe.Logger"))

  private static var _policyTypeToLOBCodeMap = ImmutableMap.of(PolicyType.TC_BUSINESSAUTO, LOBCode.TC_BUSINESSAUTOLINE,
    PolicyType.TC_COMMERCIALPROPERTY, LOBCode.TC_CPLINE,
    PolicyType.TC_HOPHOMEOWNERS, LOBCode.TC_HOPLINE,
    PolicyType.TC_PERSONALAUTO, LOBCode.TC_PERSONALAUTOLINE
  )

  private static var _policyTypeToLossTypeMap = ImmutableMap.of(PolicyType.TC_BUSINESSAUTO, LossType.TC_AUTO,
    PolicyType.TC_PERSONALAUTO, LossType.TC_AUTO,
    PolicyType.TC_COMMERCIALPROPERTY, LossType.TC_PR,
    PolicyType.TC_HOPHOMEOWNERS, LossType.TC_PR
  )

  /**
   * Creates a cat claim from a policy.
   *
   * Returns a claim #
   */
  @IncludeInDocumentation
  @Param("aPolicy", "A full policy from the Policy System")
  @Param("aCat", "A ClaimCenter catastrophe")
  @Returns("Claim number for the newly created claim")
  public static function createCatastropheTemplateClaim(aPolicy: Policy, aCat: Catastrophe): String {
    _log.info("Entering method createQuickSetupClaim...")
    if (not CatastropheProperties.INSTANCE.FeatureEnabled) {
      throw new IllegalAccessException(DisplayKey.get("SP.Catastrophe.Error.FeatureDisabled"))
    }
    // Loss cause pulled from template claim settings
    var templateSettings = aCat.CatClaimTemplateSettings_SP
    /**
     * Prevent method from continuing unless we have ACTIVE catastrophe claim template settings.
     */
    if (templateSettings == null or !templateSettings.Active) {
      var errorMessage = "No catastrophe claim template settings available for catastrophe: " + aCat
      throw errorMessage
    }
    var claimNumber = ""
    gw.transaction.Transaction.runWithNewBundle(\bundle -> {
      // Create a claim
      var aClaim = new Claim(bundle)
      addClaimDetails(aPolicy, aCat, aClaim, templateSettings)
      // Assign claim using specified assignment type
      assignClaimFromTemplate(aClaim, templateSettings)
      // Run the exposure rules
      createExposuresFromTemplate(aClaim, templateSettings)
      claimNumber = aClaim.ClaimNumber
    })

    _log.info("Catastrophe: " + aCat.Name)
    _log.info("Exiting method createQuickSetupClaim...")
    return claimNumber
  }

  /**
   * Add details to the newly created claim.
   */
  @Param("aPolicy", "A full policy from the Policy System")
  @Param("aCat", "A ClaimCenter catastrophe")
  @Param("aClaim", "A newly created Claim")
  @Param("templateSettings", "Catastrophe template settings")
  private static function addClaimDetails(aPolicy : Policy, aCat : Catastrophe, aClaim : Claim, templateSettings : ClaimTemplateSettings_SP) {
    aClaim.CatFromCatClaimTemplate_SP = true
    aClaim.Description = "Template claim for catastrophe: " + aCat.Name
    // Determine LOB and loss type based on policy type
    aClaim.LOBCode = _policyTypeToLOBCodeMap.get(aPolicy.PolicyType)
    aClaim.LossType = _policyTypeToLossTypeMap.get(aPolicy.PolicyType)
    if (aClaim.LOBCode == null) {
      throw "Unable to identify LOB code for policy type: " + aPolicy.PolicyType
    }
    if (aClaim.LossType == null) {
      throw "Unable to identify loss type for policy type: " + aPolicy.PolicyType
    }
    // Set claim location to first risk unit on policy
    aClaim.LossLocation = (aPolicy.RiskUnits[0] as LocationBasedRU).Property.Address
    aClaim.JurisdictionState = gw.api.address.AddressJurisdictionHandler.getJurisdiction(aPolicy.PolicyLocations[0].Address)
    aClaim.ReportedDate = Date.CurrentDate
    aClaim.LossDate = Date.CurrentDate
    aClaim.Catastrophe = aCat
    aClaim.Policy = aPolicy
    aClaim.reporter = User.util.CurrentUser.Contact
    aClaim.LossCause = templateSettings.LossCause
  }

  /**
   * Assign claim using specified assignment type
   */
  @Param("aClaim", "A newly created Claim")
  @Param("templateSettings", "Catastrophe template settings")
  private static function assignClaimFromTemplate(aClaim : Claim, templateSettings : ClaimTemplateSettings_SP) {
    var targetGroup = templateSettings.AssignGroup
    var targetUser = templateSettings.AssignUser
    switch (templateSettings.AssignMethod) {
      case ClaimTempAssignType_SP.TC_RULES:
          targetGroup = User.util.CurrentUser.GroupUsers[0].Group
          targetUser = User.util.CurrentUser
          break
      case ClaimTempAssignType_SP.TC_QUEUE:
          targetGroup = templateSettings.AssignQueue.Group
          targetUser = targetGroup.Supervisor
          // Assign the claim to the intake group’s supervisor. This “parks” the claim until the final assignment determination.
          aClaim.assign(targetGroup, targetUser)
          // Create a review new claim setup activity and assign it on the queue of the designated intake group.
          aClaim.createActivityFromPattern(null, ActivityPattern.finder.getActivityPatternByCode("fnol_review"))
              .assignActivityToQueue(templateSettings.AssignQueue, targetGroup)
          break
      case ClaimTempAssignType_SP.TC_GROUP:
          targetUser = null
          aClaim.assignGroup(targetGroup)
          break
      case ClaimTempAssignType_SP.TC_INDIVIDUAL:
          if (targetGroup != null) {
            aClaim.assign(targetGroup, targetUser)
          } else {
            aClaim.assignUserAndDefaultGroup(targetUser)
            targetGroup = aClaim.AssignedGroup
          }
          break
        default:
        throw "Unknown assignment method: " + templateSettings.AssignMethod
    }

    var assignee = gw.api.assignment.UserAssignee.createSimpleAssignee(targetGroup.ID, targetUser.ID)
    aClaim.saveAndSetup(assignee, null)
  }

  /**
   * Create exposures based on the template settings
   */
  @Param("aClaim", "A newly created Claim")
  @Param("templateSettings", "Catastrophe template settings")
  private static function createExposuresFromTemplate(aClaim : Claim, templateSettings : ClaimTemplateSettings_SP) {
    // Iterate through exposure rules
    for (eachExposureRule in templateSettings.ExposureRules) {
      var coverageType = eachExposureRule.CoverageType
      var coverageSubtype = eachExposureRule.CoverageSubtype

      // Iterate through risk units on the policy
      for (eachRiskUnit in aClaim.Policy.RiskUnits) {

        // For location-based risk units...
        if (eachRiskUnit typeis LocationBasedRU) {
          // Check coverages against exposure rule.
          for (eachCoverage in eachRiskUnit.Coverages) {
            if (eachCoverage.Type == coverageType) {
              // Coverage on risk unit matches exposure rule. Create an exposure
              var newExposure = aClaim.newExposure(coverageType, coverageSubtype, true)
              newExposure.Coverage = eachCoverage
              if (eachExposureRule.ReservePercent != null and eachCoverage.HasIncidentLimit) {
                // Setup the reserves on this exposure according to the % setting defined on the cat claim template
                var targetReserveAmount = eachCoverage.IncidentLimit * eachExposureRule.ReservePercent / 100
                newExposure.setAvailableReserves(CostType.TC_CLAIMCOST, CostCategory.TC_PROPERTY_REPAIR, targetReserveAmount, User.util.CurrentUser)
              }
              newExposure.saveAndSetup()
            }
          }
        }
      }
    }
    // Ensure exposure number has no gaps
    aClaim.OrderedExposures.eachWithIndex(\exposure, index -> {
      exposure.ClaimOrder = index + 1
    })
  }
}
