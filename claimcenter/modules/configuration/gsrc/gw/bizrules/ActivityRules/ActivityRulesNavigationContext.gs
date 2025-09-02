package gw.bizrules.ActivityRules

uses com.google.common.collect.ImmutableMap
uses gw.api.locale.DisplayKey
uses gw.api.web.SessionVar
uses gw.bizrules.CCRulePermissions
uses gw.bizrules.CCRulesNavigationContextBase
uses gw.bizrules.pcf.CommandDefinitionController
uses gw.bizrules.pcf.CommandDefinitionUIConfig
uses gw.bizrules.pcf.RuleCommandDefinitionHolder
uses gw.bizrules.ruleaction.config.ParameterSetPassthroughCommandDefinitionUIConfig
uses gw.bizrules.ruleaction.generateactivity.config.GenerateActivityCommandParameterSet
uses gw.bizrules.ruleaction.generatehistoryevent.config.GenerateHistoryEventCommandParameterSet
uses gw.bizrules.ruleaction.setfield.config.SetFieldCommandParameterSet
uses pcf.ActivityRuleDetail
uses pcf.ActivityRules
uses pcf.CreateActivityRulePage
uses typekey.Rule

@Export
class ActivityRulesNavigationContext extends CCRulesNavigationContextBase<ActivityRule> {
  private static final var _uiConfigs: Map<RuleActionKey, CommandDefinitionUIConfig> = ImmutableMap.copyOf({
      RuleActionKey.TC_GENERATEACTIVITY->new ParameterSetPassthroughCommandDefinitionUIConfig(GenerateActivityCommandParameterSet.Config, "generateactivity"),
      RuleActionKey.TC_GENERATEHISTORYEVENT->new ParameterSetPassthroughCommandDefinitionUIConfig(GenerateHistoryEventCommandParameterSet.Config, "generatehistoryevent"),
      RuleActionKey.TC_SETFIELD->new ParameterSetPassthroughCommandDefinitionUIConfig(SetFieldCommandParameterSet.Config, "setfield")
  })

  static var _sessionInstance = new SessionVar<ActivityRulesNavigationContext>()

  static property get Instance(): ActivityRulesNavigationContext {
    var instance: ActivityRulesNavigationContext
    if (_sessionInstance.RequestAvailable) {
      instance = _sessionInstance.get()
      if (instance == null) {
        instance = new ()
        _sessionInstance.set(instance)
      }
    }
    return instance
  }

  var _ruleFilterCriteria: ActivityRuleFilterCriteria as readonly RuleFilterCriteria = new ()

  protected construct() {
    super(CCRulePermissions.givenSubtypePermissions(
        :approve = perm.System.activityruleapprove,
        :deploy = perm.System.activityruledeploy,
        :edit = perm.System.activityruleedit,
        :import = perm.System.activityruleimport,
        :view = perm.System.activityruleview
    ))
  }

  /**
   * Defines the UI Configs used by each Rule Action
   */
  property get UIConfigs(): java.util.Map<RuleActionKey, CommandDefinitionUIConfig> {
    return _uiConfigs
  }

  protected override function goToCloneTypedRulePage(ruleToClone: ActivityRule) {
    CreateActivityRulePage.go(this, DisplayKey.get('Web.BizRules.Rule.Clone', ruleToClone.Name), ruleToClone, UUID.randomUUID().toString())
  }

  override function goToCreateRulePage() {
    CreateActivityRulePage.go(this, DisplayKey.get("Web.ActivityRules.CreateRule"), UUID.randomUUID().toString())
  }

  override function createCommandDefinition(controller : CommandDefinitionController, ruleActions : List<RuleActionKey>) : RuleCommandDefinitionHolder {
    var commandDefinition = controller.addCommandDefinition()
    if (ruleActions.Count == 1 and commandDefinition != null) {
      commandDefinition.RuleActionKey = ruleActions.single()
    }
    return commandDefinition
  }

  override function goToRuleDetailPage(version: RuleVersion) {
    ActivityRuleDetail.drilldown(this, version)
  }

  override function goToRulesListPage() {
    ActivityRules.go()
  }

  override property get DefaultRuleConditionType(): RuleConditionType {
    return RuleConditionType.TC_ALWAYSTRUE
  }

  override property get RuleType(): typekey.Rule {
    return Rule.TC_ACTIVITYRULE;
  }

  override function goToRulesListPage(ruleTypeRef: typekey.Rule) {
    ActivityRules.go()
  }
}
