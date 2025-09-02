package gw.bizrules

uses com.google.common.collect.Maps
uses gw.bizrules.context.CCRulesContextParameterName
uses gw.bizrules.context.RuleContextDefinitionBuilder
uses gw.bizrules.ruleaction.defaultvaluehandler.RelatedToDefaultValueHandler
uses gw.bizrules.ruleaction.behavioralcommandparam.activityrestriction.ActivityRestriction
uses gw.bizrules.ruleaction.behavioralcommandparam.assignee.ActivityAssigneeLoader
uses gw.bizrules.ruleaction.behavioralcommandparam.relatedto.ActivityRulesRelatedTo
uses gw.plugin.bizrules.BizRulesUtility
uses gw.plugin.bizrules.BehavioralCommandParameterExtension
uses gw.plugin.bizrules.DefaultValueHandler
uses gw.bizrules.ruleaction.defaultvaluehandler.ActivityRestrictionDefaultValueHandler
uses gw.bizrules.ruleaction.defaultvaluehandler.ActivityAssigneeDefaultValueHandler
uses gw.bizrules.ruleaction.generateactivity.config.GenerateActivityCommandParameterSet
uses gw.bizrules.ruleaction.generatehistoryevent.config.GenerateHistoryEventCommandParameterSet
uses gw.lang.reflect.features.IMethodReference
uses gw.lang.reflect.features.IPropertyReference
uses gw.plugin.bizrules.ICCBizRulesPlugin
uses gw.plugin.bizrules.RuleActionExtension

/**
 * Business Rules Plugin defines the following to be used by the Business Rules Framework:
 * - Trigger Points
 * - Contexts to be used
 * - Whitelisted methods on the context
 * - Blacklisted properties on the context
 *
 * This provides the necessary information for the rules engine to render the screen and provide
 * autocomplete suggestions.
 */
@Export
class CCBizRulesPlugin implements ICCBizRulesPlugin {
  private var _blackListedProperties: HashSet<IPropertyReference>
  private var _whiteListedMethods: HashMap<IMethodReference, String>
  private var _blackListedMethods: HashSet<IMethodReference>
  private var _triggeringPoints: Map<TriggeringPointKey, IRuleContextDefinition[]>

  construct() {
    // Initialize the properties
    _blackListedProperties = new HashSet<IPropertyReference>()
    setBlackListedPropertiesOnClaim()
    setBlackListedPropertiesOnExposure()
    setBlackListedPropertiesOnIncident()

    _whiteListedMethods = new HashMap<IMethodReference, String>()
    setWhiteListedMethodsOnClaim()
    setWhiteListedMethodsOnExposure()
    setWhiteListedMethodsOnIncident()
    setWhiteListedMethodsOnAddress()
    setWhiteListedMethodsOnPayment()

    _blackListedMethods = new HashSet<IMethodReference>()

    // Initialize the contexts
    var claimCD = new RuleContextDefinitionBuilder()
        .withRuleContextDefinitionKey(RuleContextDefinitionKey.TC_CLAIM)
        .withSymbol(CCRulesContextParameterName.claim.Name, Claim)
        .withSymbol(CCRulesContextParameterName.Util.Name, CCRulesUtility)
        .build()
    var incidentCD = new RuleContextDefinitionBuilder()
        .withRuleContextDefinitionKey(RuleContextDefinitionKey.TC_INCIDENT)
        .withSymbol(CCRulesContextParameterName.incident.Name, Incident)
        .withSymbol(CCRulesContextParameterName.Util.Name, CCRulesUtility)
        .build()
    var exposureCD = new RuleContextDefinitionBuilder()
        .withRuleContextDefinitionKey(RuleContextDefinitionKey.TC_EXPOSURE)
        .withSymbol(CCRulesContextParameterName.exposure.Name, Exposure)
        .withSymbol(CCRulesContextParameterName.claim.Name, Claim)
        .withSymbol(CCRulesContextParameterName.Util.Name, CCRulesUtility)
        .build()
    var expoIterCD = new RuleContextDefinitionBuilder()
        .withRuleContextDefinitionKey(RuleContextDefinitionKey.TC_EXPOSUREITERATIVE)
        .withSymbol(CCRulesContextParameterName.exposure.Name, Exposure)
        .withSymbol(CCRulesContextParameterName.claim.Name, Claim)
        .withSymbol(CCRulesContextParameterName.Util.Name, CCRulesUtility)
        .build()
    var checksetIterCD = new RuleContextDefinitionBuilder()
        .withRuleContextDefinitionKey(RuleContextDefinitionKey.TC_CHECKSETITERATIVE)
        .withSymbol(CCRulesContextParameterName.claim.Name, Claim)
        .withSymbol(CCRulesContextParameterName.checkset.Name, CheckSet)
        .withSymbol(CCRulesContextParameterName.check.Name, Check)
        .withSymbol(CCRulesContextParameterName.Util.Name, CCRulesUtility)
        .build()
    var recoverysetIterCD = new RuleContextDefinitionBuilder()
        .withRuleContextDefinitionKey(RuleContextDefinitionKey.TC_RECOVERYSETITERATIVE)
        .withSymbol(CCRulesContextParameterName.claim.Name, Claim)
        .withSymbol(CCRulesContextParameterName.recoveryset.Name, RecoverySet)
        .withSymbol(CCRulesContextParameterName.recovery.Name, Recovery)
        .withSymbol(CCRulesContextParameterName.Util.Name, CCRulesUtility)
        .build()
    var reservesetIterCD = new RuleContextDefinitionBuilder()
        .withRuleContextDefinitionKey(RuleContextDefinitionKey.TC_RESERVESETITERATIVE)
        .withSymbol(CCRulesContextParameterName.claim.Name, Claim)
        .withSymbol(CCRulesContextParameterName.reserveset.Name, ReserveSet)
        .withSymbol(CCRulesContextParameterName.reserve.Name, Reserve)
        .withSymbol(CCRulesContextParameterName.Util.Name, CCRulesUtility)
        .build()
    var recoveryreservesetIterCD = new RuleContextDefinitionBuilder()
        .withRuleContextDefinitionKey(RuleContextDefinitionKey.TC_RECOVERYRESERVESETITERATIVE)
        .withSymbol(CCRulesContextParameterName.claim.Name, Claim)
        .withSymbol(CCRulesContextParameterName.recoveryreserveset.Name, RecoveryReserveSet)
        .withSymbol(CCRulesContextParameterName.recoveryreserve.Name, RecoveryReserve)
        .withSymbol(CCRulesContextParameterName.Util.Name, CCRulesUtility)
        .build()
    var subroIterCD = new RuleContextDefinitionBuilder()
        .withRuleContextDefinitionKey(RuleContextDefinitionKey.TC_SUBROGATIONITERATIVE)
        .withSymbol(CCRulesContextParameterName.subrogation.Name, Subrogation)
        .withSymbol(CCRulesContextParameterName.claim.Name, Claim)
        .withSymbol(CCRulesContextParameterName.Util.Name, CCRulesUtility)
        .build()

    // Initialize the triggers
    _triggeringPoints = Maps.newHashMap<TriggeringPointKey, IRuleContextDefinition[]>()
    _triggeringPoints.put(TriggeringPointKey.TC_CREATION, {claimCD,exposureCD,expoIterCD,incidentCD}.toTypedArray())
    _triggeringPoints.put(TriggeringPointKey.TC_UPDATE, {claimCD,exposureCD,expoIterCD,checksetIterCD,recoverysetIterCD,reservesetIterCD,recoveryreservesetIterCD,subroIterCD}.toTypedArray())
    _triggeringPoints.put(TriggeringPointKey.TC_EXCEPTION, {claimCD,expoIterCD}.toTypedArray())
  }

  override property get BlackListedProperties(): Set<IPropertyReference> {
    return Collections.unmodifiableSet(_blackListedProperties)
  }

  override property get WhiteListedMethods(): Map<IMethodReference, String> {
    return Collections.unmodifiableMap(_whiteListedMethods)
  }

  override property get BlackListedMethods(): Set<IMethodReference> {
    return Collections.unmodifiableSet(_blackListedMethods)
  }

  override property get TriggeringPointMap(): Map<TriggeringPointKey, IRuleContextDefinition[]> {
    return Collections.unmodifiableMap(_triggeringPoints)
  }

  override property get RuleActionExtensions(): Map<RuleActionKey, RuleActionExtension> {
    return {
        RuleActionKey.TC_GENERATEACTIVITY->new RuleActionExtension<GenerateActivityCommandParameterSet, List<Activity>>() {
          override function execute(commandParameterSet: GenerateActivityCommandParameterSet, actionOutput: List<Activity>) {
            //set any activity extension fields here, e.g.
            //actionOutput.each(\activity -> activity.NewParam = commandParameterSet.NEW_PARAM)
          }
        },
        RuleActionKey.TC_GENERATEHISTORYEVENT->new RuleActionExtension<GenerateHistoryEventCommandParameterSet, History>() {
          override function execute(commandParameterSet: GenerateHistoryEventCommandParameterSet, actionOutput: History) {
            //set any history extension fields here
          }
        }
    }
  }

  override property get DefaultValueHandlers() : Map<Class, DefaultValueHandler> {
    return {ActivityAssigneeLoader-> new ActivityAssigneeDefaultValueHandler(),
        ActivityRulesRelatedTo-> new RelatedToDefaultValueHandler(),
        ActivityRestriction-> new ActivityRestrictionDefaultValueHandler()
    }
  }

  override property get BehavioralCommandParameterExtensions() : Map<Class, BehavioralCommandParameterExtension> {
    return {
        ActivityAssigneeLoader->new BehavioralCommandParameterExtension<ActivityAssigneeLoader>() {
          override function registerBehavioralCommandParameterValues(list: List<ActivityAssigneeLoader>) {
            // Add any new ActivityAssigneeLoaders to this list to be registered the ActivityAssigneeLoaderFactory
          }
        },
        ActivityRulesRelatedTo->new BehavioralCommandParameterExtension<ActivityRulesRelatedTo>() {
          override function registerBehavioralCommandParameterValues(list: List<ActivityRulesRelatedTo>) {
            // Add any new ActivityRulesRelatedTos to this list to be registered the ActivityRulesRelatedToFactory
          }
        },
        ActivityRestriction->new BehavioralCommandParameterExtension<ActivityRestriction>() {
          override function registerBehavioralCommandParameterValues(list: List<ActivityRestriction>) {
            // Add any new ActivityRestrictions to this list to be registered the ActivityRestrictionFactory
          }
        }
    }
  }

  override property get BizRulesUtility() : BizRulesUtility {
    return CCRulesUtility.INSTANCE
  }

  /**
   * Method to list all blacklisted properties on claim
   */
  @SuppressWarnings("deprecation")
  private function setBlackListedPropertiesOnClaim() {
    _blackListedProperties.add(Claim#Access)
    _blackListedProperties.add(Claim#AddressOwner)
    _blackListedProperties.add(Claim#AllocatedClaimNumber)
    _blackListedProperties.add(Claim#AllocatedClaimNumberArray)
    _blackListedProperties.add(Claim#ApplicableActivityPatterns)
    _blackListedProperties.add(Claim#AllowedContactRolesForEntity)
    _blackListedProperties.add(Claim#ArchivePartition)
    _blackListedProperties.add(Claim#AutomatedHandlers)
    _blackListedProperties.add(Claim#CheckCreator)
    _blackListedProperties.add(Claim#ChecksQuery)
    _blackListedProperties.add(Claim#ChildrenForCascadeAssignment)
    _blackListedProperties.add(Claim#ClaimIndicator)
    _blackListedProperties.add(Claim#ClaimMetric)
    _blackListedProperties.add(Claim#ClaimMetricRecalculationTime)
    _blackListedProperties.add(Claim#ClaimMetricRecalculationTimeArray)
    _blackListedProperties.add(Claim#ClaimSynchStates)
    _blackListedProperties.add(Claim#ClaimNumberGenerationEnabled)
    _blackListedProperties.add(Claim#ContactsWithPreload)
    _blackListedProperties.add(Claim#DecimalClaimMetric)
    _blackListedProperties.add(Claim#DuplicateClaimNumber)
    _blackListedProperties.add(Claim#DuplicateClaimNumbers)
    _blackListedProperties.add(Claim#ExposureListChangeable)
    _blackListedProperties.add(Claim#ExposureListVisibleInClaimFile)
    _blackListedProperties.add(Claim#ExposureListVisibleInLossDetails)
    _blackListedProperties.add(Claim#LossLocationSpatialDenorm)
    _blackListedProperties.add(Claim#MoneyClaimMetric)
    _blackListedProperties.add(Claim#MultiCurrencyDisplayMode)
    _blackListedProperties.add(Claim#PercentClaimMetric)
    _blackListedProperties.add(Claim#PolicyProperties)
    _blackListedProperties.add(Claim#Properties)
    _blackListedProperties.add(Claim#RecoveriesQuery)
    _blackListedProperties.add(Claim#RecoveryReservesQuery)
    _blackListedProperties.add(Claim#ReservesQuery)
    _blackListedProperties.add(Claim#TimeBasedClaimMetric)
    _blackListedProperties.add(Claim#TransactionsQuery)
    _blackListedProperties.add(Claim#UndeletableDocumentPublicIds)
    _blackListedProperties.add(Claim#Workflows)
  }

  /**
   * Method to list all blacklisted properties on exposure
   */
  @SuppressWarnings("deprecation")
  private function setBlackListedPropertiesOnExposure() {
    _blackListedProperties.add(Exposure#ArchivePartition)
    _blackListedProperties.add(Exposure#ChildrenForCascadeAssignment)
    _blackListedProperties.add(Exposure#ClaimContactsForAllRoles)
    _blackListedProperties.add(Exposure#DirectURL)
    _blackListedProperties.add(Exposure#ExposureMetric)
    _blackListedProperties.add(Exposure#ExposureMetrics)
    _blackListedProperties.add(Exposure#ExposureSynchStates)
    _blackListedProperties.add(Exposure#PaymentsQuery)
    _blackListedProperties.add(Exposure#Transactions)
    _blackListedProperties.add(Exposure#TransactionsQuery)
  }

  /**
   * Method to list all blacklisted properties on incident
   */
  @SuppressWarnings("deprecation")
  private function setBlackListedPropertiesOnIncident() {
    _blackListedProperties.add(Incident#ArchivePartition)
    _blackListedProperties.add(Incident#DefaultIconSet)
    _blackListedProperties.add(Incident#HeaderIcon)
    _blackListedProperties.add(Incident#PanelIcon)
  }

  /**
   * Method to list all whitelisted methods on claim
   */
  private function setWhiteListedMethodsOnClaim() {
    _whiteListedMethods.put(Claim#getCatastropheMatchesByZone(), "Method to find all catastrophes that are possible matches for this claim")
    _whiteListedMethods.put(Claim#isFieldChanged(String), "Method to test if a field has changed")
  }

  /**
   * Method to list all whitelisted methods on exposure
   */
  private function setWhiteListedMethodsOnExposure() {
    _whiteListedMethods.put(Exposure#isFieldChanged(String), "Method to test if a field has changed")
  }

  /**
   * Method to list all whitelisted methods on incident
   */
  private function setWhiteListedMethodsOnIncident() {
    _whiteListedMethods.put(Incident#isFieldChanged(String), "Method to test if a field has changed")
  }

  /**
   * Method to list all whitelisted methods on address
   */
  private function setWhiteListedMethodsOnAddress() {
    _whiteListedMethods.put(Address#isChanged(),"Method to test if a field has changed")
  }

  /**
   * Method to list all whitelisted methods on payment
   */
  private function setWhiteListedMethodsOnPayment() {
    _whiteListedMethods.put(Payment#isNewPayment(),"Method to test if the payment is new")
  }
}