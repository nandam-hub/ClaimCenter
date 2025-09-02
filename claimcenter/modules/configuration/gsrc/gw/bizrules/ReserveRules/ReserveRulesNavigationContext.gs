package gw.bizrules.ReserveRules

uses com.google.common.collect.ImmutableMap
uses gw.api.locale.DisplayKey
uses gw.api.web.SessionVar
uses gw.bizrules.CCRulePermissions
uses gw.bizrules.CCRulesNavigationContextBase
uses gw.bizrules.pcf.CommandDefinitionController
uses gw.bizrules.pcf.CommandDefinitionUIConfig
uses gw.bizrules.pcf.RuleCommandDefinitionHolder
uses gw.bizrules.ruleaction.config.ParameterSetPassthroughCommandDefinitionUIConfig
uses gw.bizrules.ruleaction.createreserve.config.ReserveCommandParameterSet
uses pcf.CreateReserveRulePage
uses pcf.ReserveRuleDetail
uses pcf.ReserveRules
uses typekey.Rule

@Export
class ReserveRulesNavigationContext extends CCRulesNavigationContextBase<ReserveRule> {

  private static final var _uiConfigs: Map<RuleActionKey, CommandDefinitionUIConfig> = ImmutableMap.copyOf({
      RuleActionKey.TC_CREATERESERVE->new ParameterSetPassthroughCommandDefinitionUIConfig(ReserveCommandParameterSet.Config, "createreserve")
  })

  static var _sessionInstance = new SessionVar<ReserveRulesNavigationContext>()

  static property get Instance(): ReserveRulesNavigationContext {
    var instance: ReserveRulesNavigationContext
    if (_sessionInstance.RequestAvailable) {
      instance = _sessionInstance.get()
      if (instance == null) {
        instance = new ()
        _sessionInstance.set(instance)
      }
    }
    return instance
  }

  var _ruleFilterCriteria: ReserveRuleFilterCriteria as readonly RuleFilterCriteria = new ()

  /**
   * Defines the UI Configs used by each Rule Action
   */
  property get UIConfigs(): Map<RuleActionKey, CommandDefinitionUIConfig> {
    return _uiConfigs
  }

  protected construct() {
    super(CCRulePermissions.givenSubtypePermissions(
        :approve = perm.System.reserveruleapprove,
        :deploy = perm.System.reserveruledeploy,
        :edit = perm.System.reserveruleedit,
        :import = perm.System.reserveruleimport,
        :view = perm.System.reserveruleview
    ))
  }

  protected override function goToCloneTypedRulePage(ruleToClone: ReserveRule) {
    CreateReserveRulePage.go(this, DisplayKey.get('Web.BizRules.Rule.Clone', ruleToClone.Name), ruleToClone, UUID.randomUUID().toString())
  }

  override function goToCreateRulePage() {
    CreateReserveRulePage.go(this, DisplayKey.get("Web.ReserveRules.CreateRule"), UUID.randomUUID().toString())
  }

  override function createCommandDefinition(controller: CommandDefinitionController, ruleActions: List<RuleActionKey>): RuleCommandDefinitionHolder {
    var commandDefinition = controller.addCommandDefinition()
    if (ruleActions.Count == 1 and commandDefinition != null) {
      commandDefinition.RuleActionKey = ruleActions.single()
    }
    return commandDefinition
  }

  override function goToRuleDetailPage(version: RuleVersion) {
    ReserveRuleDetail.drilldown(this, version)
  }

  override function goToRulesListPage() {
    ReserveRules.go()
  }

  override property get DefaultRuleConditionType(): RuleConditionType {
    return RuleConditionType.TC_ALWAYSTRUE
  }

  override property get RuleType(): Rule {
    return Rule.TC_RESERVERULE;
  }

  override function goToRulesListPage(ruleTypeRef: Rule) {
    ReserveRules.go()
  }
}
