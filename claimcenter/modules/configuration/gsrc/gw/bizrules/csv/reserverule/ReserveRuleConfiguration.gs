package gw.bizrules.csv.reserverule

uses gw.bizrules.csv.*
uses gw.bizrules.csv.deserializers.*
uses gw.bizrules.csv.getters.RuleValueGetter
uses gw.bizrules.csv.getters.ActionValueGetter
uses gw.bizrules.csv.serializers.*
uses gw.bizrules.csv.setters.*
uses gw.bizrules.csv.validators.NoneValidator

/**
 * RuleConfiguration for Reserve Rules.
 */
@Export
class ReserveRuleConfiguration {
  var _globalPublicRuleId: ColumnConfiguration as readonly GlobalPublicRuleId
  var _ruleName: ColumnConfiguration as readonly RuleName
  var _description: ColumnConfiguration as readonly Description
  var _triggerEntity: ColumnConfiguration as readonly TriggerEntity
  var _triggerAction: ColumnConfiguration as readonly TriggerAction
  var _enabled: ColumnConfiguration as readonly Enabled
  var _lossType: ColumnConfiguration as readonly LossType
  var _policyType: ColumnConfiguration as readonly PolicyType
  var _claimJurisdiction: ColumnConfiguration as readonly ClaimJurisdiction
  var _exposureType: ColumnConfiguration as readonly ExposureType
  var _exposureSegment: ColumnConfiguration as readonly ExposureSegment
  var _ruleVariables: ColumnConfiguration as readonly RuleVariables
  var _ruleCondition: ColumnConfiguration as readonly RuleCondition

  var _actionType: ColumnConfiguration as readonly ActionType
  var _costType: ColumnConfiguration as readonly CostType
  var _costCategory: ColumnConfiguration as readonly CostCategory
  var _respectFinancialHolds: ColumnConfiguration as readonly RespectFinancialHolds
  var _amount: ColumnConfiguration as readonly Amount
  var _currency: ColumnConfiguration as readonly Currency
  var _comments: ColumnConfiguration as readonly Comments

  construct(appcriteriaFactory: AppCriteriaFactory) {
    _globalPublicRuleId = createGlobalPublicIdConfig()
    _ruleName = createRuleNameConfig()
    _description = createDescriptionConfig()
    _triggerEntity = createTriggerEntityConfig()
    _triggerAction = createTriggerActionConfig()
    _enabled = createEnabledConfig()
    _lossType = createLossTypeConfig(appcriteriaFactory)
    _policyType = createPolicyTypeConfig(appcriteriaFactory)
    _claimJurisdiction = createClaimJurisdictionConfig(appcriteriaFactory)
    _exposureType = createExposureTypeConfig(appcriteriaFactory)
    _exposureSegment = createExposureSegmentConfig(appcriteriaFactory)
    _ruleVariables = createRuleVariablesConfig()
    _ruleCondition = createRuleConditionConfig()

    _actionType = createActionTypeConfig()
    _costType = createCostTypeConfig()
    _costCategory = createCostCategoryConfig()
    _respectFinancialHolds = createRespectFinancialHoldsConfig()
    _amount = createAmountConfig()
    _currency = createCurrencyConfig()
    _comments = createCommentsConfig()
  }

  property get Columns() : ColumnConfiguration[] {
    return {
        _globalPublicRuleId,
        _ruleName,
        _description,
        _triggerEntity,
        _triggerAction,
        _enabled,
        _lossType,
        _policyType,
        _claimJurisdiction,
        _exposureType,
        _exposureSegment,
        _ruleVariables,
        _ruleCondition,
        _actionType,
        _costType,
        _costCategory,
        _respectFinancialHolds,
        _amount,
        _currency,
        _comments
    }
  }

  private function createGlobalPublicIdConfig(): ColumnConfiguration {
    return new ColumnConfiguration(
        new StringCsvSerializer(),
        new StringCsvDeserializer(),
        new RuleValueGetter(\rule -> rule.Versions.first().GlobalRuleID),
        new NoneSetter(),
        new NoneValidator(),
        :columnId = "GlobalRuleID",
        :columnName = "Global Rule ID (NO EDIT)",
        :isActionColumn = false,
        :isIgnoredDuringImport = false)
  }

  private function createRuleNameConfig(): ColumnConfiguration {
    return new ColumnConfiguration(
        new StringCsvSerializer(),
        new StringCsvDeserializer(),
        new RuleValueGetter(Rule#Name),
        new RuleValueSetter(Rule#Name),
        new NoneValidator(),
        :columnId = "Name",
        :columnName = "Name (R)",
        :isActionColumn = false,
        :isIgnoredDuringImport = false)
  }

  private function createDescriptionConfig(): ColumnConfiguration {
    return new ColumnConfiguration(
        new StringCsvSerializer(),
        new StringCsvDeserializer(),
        new RuleValueGetter(Rule#Description),
        new RuleValueSetter(Rule#Description),
        new NoneValidator(),
        :columnId = "Description",
        :columnName = "Description",
        :isActionColumn = false,
        :isIgnoredDuringImport = false)
  }

  private function createTriggerEntityConfig() : ColumnConfiguration {
    return new ColumnConfiguration(
        new TypekeyCsvSerializer(),
        new TypekeyCsvDeserializer(RuleContextDefinitionKey.TYPE),
        new RuleValueGetter(Rule#RuleContextDefinitionKey),
        new RuleValueSetter(Rule#RuleContextDefinitionKey),
        new NoneValidator(),
        :columnId = "TriggerEntity",
        :columnName = "Trigger Entity (R)",
        :isActionColumn = false,
        :isIgnoredDuringImport = false)
  }

  private function createTriggerActionConfig() : ColumnConfiguration {
    return new ColumnConfiguration(
        new TypekeyCsvSerializer(),
        new TypekeyCsvDeserializer(TriggeringPointKey.TYPE),
        new RuleValueGetter(Rule#TriggeringPointKey),
        new RuleValueSetter(Rule#TriggeringPointKey),
        new NoneValidator(),
        :columnId = "TriggerAction",
        :columnName = "Trigger Action (R)",
        :isActionColumn = false,
        :isIgnoredDuringImport = false)
  }

  private function createEnabledConfig() : ColumnConfiguration {
    return new ColumnConfiguration(
        new BooleanCsvSerializer(),
        new BooleanCsvDeserializer(),
        new RuleValueGetter(Rule#AvailableToRun),
        new RuleValueSetter(Rule#AvailableToRun),
        new NoneValidator(),
        :columnId = "Enabled",
        :columnName = "Enabled (R)",
        :isActionColumn = false,
        :isIgnoredDuringImport = false)
  }

  private function createLossTypeConfig(appCriteriaFactory: AppCriteriaFactory) : ColumnConfiguration {
    return new ColumnConfiguration(
        new TypekeyArrayCsvSerializer(AppCritLossType.LOSSTYPE_PROP),
        new TypekeyArrayCsvDeserializer<LossType>(typekey.LossType.TYPE),
        new RuleValueGetter(ReserveRule#LossTypes),
        new RuleAppCriteriaSetter(ReserveRule#LossTypes, appCriteriaFactory),
        new NoneValidator(),
        :columnId = "LossType",
        :columnName = "Loss Type (R)",
        :isActionColumn = false,
        :isIgnoredDuringImport = false)
  }

  private function createPolicyTypeConfig(appCriteriaFactory: AppCriteriaFactory) : ColumnConfiguration {
    return new ColumnConfiguration(
        new TypekeyArrayCsvSerializer(AppCritPolicyType.POLICYTYPE_PROP),
        new TypekeyArrayCsvDeserializer<PolicyType>(typekey.PolicyType.TYPE),
        new RuleValueGetter(ReserveRule#PolicyTypes),
        new RuleAppCriteriaSetter(ReserveRule#PolicyTypes, appCriteriaFactory),
        new NoneValidator(),
        :columnId = "PolicyType",
        :columnName = "Policy Type (R)",
        :isActionColumn = false,
        :isIgnoredDuringImport = false)
  }

  private function createClaimJurisdictionConfig(appCriteriaFactory: AppCriteriaFactory) : ColumnConfiguration {
    return new ColumnConfiguration(
        new TypekeyArrayCsvSerializer(AppCritJurisdiction.JURISDICTION_PROP),
        new TypekeyArrayCsvDeserializer<Jurisdiction>(Jurisdiction.TYPE),
        new RuleValueGetter(ReserveRule#Jurisdictions),
        new RuleAppCriteriaSetter(ReserveRule#Jurisdictions, appCriteriaFactory),
        new NoneValidator(),
        :columnId = "ClaimJurisdiction",
        :columnName = "Claim Jurisdiction (R)",
        :isActionColumn = false,
        :isIgnoredDuringImport = false)
  }

  private function createExposureTypeConfig(appCriteriaFactory: AppCriteriaFactory) : ColumnConfiguration {
    return new ColumnConfiguration(
        new TypekeyArrayCsvSerializer(AppCritExposureType.EXPOSURETYPE_PROP),
        new TypekeyArrayCsvDeserializer<ExposureType>(typekey.ExposureType.TYPE),
        new RuleValueGetter(ReserveRule#ExposureTypes),
        new RuleAppCriteriaSetter(ReserveRule#ExposureTypes, appCriteriaFactory),
        new NoneValidator(),
        :columnId = "ExposureType",
        :columnName = "Exposure Type (R)",
        :isActionColumn = false,
        :isIgnoredDuringImport = false)
  }

  private function createExposureSegmentConfig(appCriteriaFactory: AppCriteriaFactory) : ColumnConfiguration {
    return new ColumnConfiguration(
        new TypekeyArrayCsvSerializer(AppCritClaimSegment.CLAIMSEGMENT_PROP),
        new TypekeyArrayCsvDeserializer<ClaimSegment>(ClaimSegment.TYPE),
        new RuleValueGetter(ReserveRule#ClaimSegments),
        new RuleAppCriteriaSetter(ReserveRule#ClaimSegments, appCriteriaFactory),
        new NoneValidator(),
        :columnId = "ExposureSegment",
        :columnName = "Exposure Segment (R)",
        :isActionColumn = false,
        :isIgnoredDuringImport = false)
  }

  private function createRuleVariablesConfig() : ColumnConfiguration {
    return new ColumnConfiguration(
        new RuleVariablesCsvSerializer(),
        new StringCsvDeserializer(),
        new RuleValueGetter(Rule#OrderedRuleVariables),
        new NoneSetter(),
        new NoneValidator(),
        :columnId = "RuleVariables",
        :columnName = "Rule Variables (NO EDIT)",
        :isActionColumn = false,
        :isIgnoredDuringImport = true)
  }

  private function createRuleConditionConfig() : ColumnConfiguration {
    return new ColumnConfiguration(
        new RuleConditionCsvSerializer(),
        new StringCsvDeserializer(),
        new RuleValueGetter(Rule#RuleCondition),
        new NoneSetter(),
        new NoneValidator(),
        :columnId = "RuleCondition",
        :columnName = "Rule Condition (NO EDIT)",
        :isActionColumn = false,
        :isIgnoredDuringImport = true)
  }

  private function createActionTypeConfig() : ColumnConfiguration {
    return new ColumnConfiguration(
        new TypekeyCsvSerializer(),
        new TypekeyCsvDeserializer(RuleActionKey.TYPE),
        new ActionValueGetter(RuleCommandDefinition#RuleActionKey),
        new RuleValueSetter(RuleCommandDefinition#RuleActionKey),
        new NoneValidator(),
        :columnId = "ActionType",
        :columnName = "Action Type (R if Action)",
        :isActionColumn = true,
        :isIgnoredDuringImport = false)
  }

  private function createCostTypeConfig() : ColumnConfiguration {
    return new ColumnConfiguration(
        new ActionParameterCsvSerializer(),
        new TypekeyCsvDeserializer(typekey.CostType.TYPE),
        new ActionValueGetter("CostType"),
        new ActionTypekeyParameterSetter("CostType"),
        new NoneValidator(),
        :columnId = "CostType",
        :columnName = "Cost Type (R if Action)",
        :isActionColumn = true,
        :isIgnoredDuringImport = false)
  }

  private function createCostCategoryConfig() : ColumnConfiguration {
    return new ColumnConfiguration(
        new ActionParameterCsvSerializer(),
        new TypekeyCsvDeserializer(typekey.CostCategory.TYPE),
        new ActionValueGetter("CostCategory"),
        new ActionTypekeyParameterSetter("CostCategory"),
        new NoneValidator(),
        :columnId = "CostCategory",
        :columnName = "Cost Category (R if Action)",
        :isActionColumn = true,
        :isIgnoredDuringImport = false)
  }

  private function createRespectFinancialHoldsConfig() : ColumnConfiguration {
    return new ColumnConfiguration(
        new ActionParameterCsvSerializer(),
        new BooleanAsStringCsvDeserializer(),
        new ActionValueGetter("RespectFinancialHolds"),
        new ActionGosuParameterSetter("RespectFinancialHolds"),
        new NoneValidator(),
        :columnId = "RespectFinancialHolds",
        :columnName = "Respect Financial Holds (R if Action)",
        :isActionColumn = true,
        :isIgnoredDuringImport = false)
  }

  private function createAmountConfig() : ColumnConfiguration {
    return new ColumnConfiguration(
        new ActionParameterCsvSerializer(),
        new StringCsvDeserializer(),
        new ActionValueGetter("Amount"),
        new ActionGosuParameterSetter("Amount"),
        new NoneValidator(),
        :columnId = "Amount",
        :columnName = "Amount (R if Action)",
        :isActionColumn = true,
        :isIgnoredDuringImport = false)
  }

  private function createCurrencyConfig() : ColumnConfiguration {
    return new ColumnConfiguration(
        new ActionParameterCsvSerializer(),
        new TypekeyOrStringCsvDeserializer(typekey.Currency.TYPE),
        new ActionValueGetter("Currency"),
        new ActionTypekeyOrGosuParameterSetter("Currency"),
        new NoneValidator(),
        :columnId = "Currency",
        :columnName = "Currency (R if Action)",
        :isActionColumn = true,
        :isIgnoredDuringImport = false)
  }

  private function createCommentsConfig() : ColumnConfiguration {
    return new ColumnConfiguration(
        new ActionParameterCsvSerializer(),
        new StringCsvDeserializer(),
        new ActionValueGetter("Comments"),
        new ActionGosuTemplateTextParameterSetter("Comments"),
        new NoneValidator(),
        :columnId = "Comments",
        :columnName = "Comments",
        :isActionColumn = true,
        :isIgnoredDuringImport = false)
  }
}