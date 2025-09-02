package gw.bizrules.ExposureRules

uses com.google.common.collect.ImmutableMap
uses gw.api.locale.DisplayKey
uses gw.api.web.SessionVar
uses gw.bizrules.CCRulePermissions
uses gw.bizrules.CCRulesNavigationContextBase
uses gw.bizrules.pcf.CommandDefinitionController
uses gw.bizrules.pcf.CommandDefinitionUIConfig
uses gw.bizrules.pcf.RuleCommandDefinitionHolder
uses gw.bizrules.ruleaction.config.ParameterSetPassthroughCommandDefinitionUIConfig
uses gw.bizrules.ruleaction.createexposure.config.ExposureCommandParameterSet
uses pcf.CreateExposureRulePage
uses pcf.ExposureRuleDetail
uses pcf.ExposureRules
uses typekey.Rule

@Export
class ExposureRulesNavigationContext extends CCRulesNavigationContextBase<ExposureRule> {
  private static final var _uiConfigs: Map<RuleActionKey, CommandDefinitionUIConfig> = ImmutableMap.copyOf({
      RuleActionKey.TC_CREATEEXPOSURE->new ParameterSetPassthroughCommandDefinitionUIConfig(ExposureCommandParameterSet.Config, "createexposure")
  })

  static var _sessionInstance = new SessionVar<ExposureRulesNavigationContext>()

  static property get Instance(): ExposureRulesNavigationContext {
    var instance: ExposureRulesNavigationContext
    if (_sessionInstance.RequestAvailable) {
      instance = _sessionInstance.get()
      if (instance == null) {
        instance = new ()
        _sessionInstance.set(instance)
      }
    }
    return instance
  }

  var _ruleFilterCriteria: ExposureRuleFilterCriteria as readonly RuleFilterCriteria = new ()

  /**
   * Defines the UI Configs used by each Rule Action
   */
  property get UIConfigs(): java.util.Map<RuleActionKey, CommandDefinitionUIConfig> {
    return _uiConfigs
  }

  protected construct() {
    super(CCRulePermissions.givenSubtypePermissions(
        :approve = perm.System.exposureruleapprove,
        :deploy = perm.System.exposureruledeploy,
        :edit = perm.System.exposureruleedit,
        :import = perm.System.exposureruleimport,
        :view = perm.System.exposureruleview
    ))
  }

  protected override function goToCloneTypedRulePage(ruleToClone: ExposureRule) {
    CreateExposureRulePage.go(this, DisplayKey.get('Web.BizRules.Rule.Clone', ruleToClone.Name), ruleToClone, UUID.randomUUID().toString())
  }

  override function goToCreateRulePage() {
    CreateExposureRulePage.go(this, DisplayKey.get("Web.ExposureRules.CreateRule"), UUID.randomUUID().toString())
  }

  override function createCommandDefinition(controller : CommandDefinitionController, ruleActions : List<RuleActionKey>) : RuleCommandDefinitionHolder {
    var commandDefinition = controller.addCommandDefinition()
    if (ruleActions.Count == 1 and commandDefinition != null) {
      commandDefinition.RuleActionKey = ruleActions.single()
    }
    return commandDefinition
  }

  override function goToRuleDetailPage(version: RuleVersion) {
    ExposureRuleDetail.drilldown(this, version)
  }

  override function goToRulesListPage() {
    ExposureRules.go()
  }

  override property get DefaultRuleConditionType(): RuleConditionType {
    return RuleConditionType.TC_ALWAYSTRUE
  }

  override property get ShowCreateActionHint(): boolean {
    return true
  }

  override property get CreateActionHintLabel(): String {
    return DisplayKey.get("Web.BizRules.Rule.Action.CreateActionHint.Exposure")
  }

  override property get RuleType(): typekey.Rule {
    return Rule.TC_EXPOSURERULE;
  }

  override function goToRulesListPage(ruleTypeRef: typekey.Rule) {
    ExposureRules.go()
  }
}
