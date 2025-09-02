package gw.bizrules

uses com.google.common.collect.Maps
uses gw.bizrules.pcf.CommandDefinitionController
uses gw.bizrules.pcf.CommandDefinitionUIConfig
uses gw.bizrules.pcf.RuleCommandDefinitionHolder
uses gw.bizrules.pcf.RuleExportImportPageHelper
uses pcf.CCRuleComparisonPopup
uses pcf.CCRuleEditPopup
uses pcf.CCRuleVersionDetailsPopup

/**
 * Navigation context used at the pages with no specific rule type defined.
 * Eventually it will try to delegate a given work to a correct context.
 */
@Export
class CCRulesDelegatingNavigationContext implements CCRulesNavigationContext<CCRule> {
  private delegate _concreteNavigationContext represents CCRulesNavigationContext<CCRule>

  construct() {
    _concreteNavigationContext = new CCRulesDefaultNavigationContext(this)
  }

  override function goToRulesListPage(ruleTypeRef: typekey.Rule) {
    var availableContextsByRule = BizRulesContexts.Contexts.partitionUniquely(\ctx -> ctx.RuleType)

    _concreteNavigationContext = availableContextsByRule.get(ruleTypeRef) ?: _concreteNavigationContext

    _concreteNavigationContext.goToRulesListPage(ruleTypeRef)
  }

  private class CCRulesDefaultNavigationContext extends CCRulesNavigationContextBase<CCRule> {
    private var _parentContext: CCRulesNavigationContext<CCRule>

    construct(parentContext: CCRulesNavigationContext<CCRule>) {
      _parentContext = parentContext
    }

    override function pushRuleVersionDetailsPopup(version: RuleVersion, importing: boolean) {
      CCRuleVersionDetailsPopup.push(_parentContext, version, importing)
    }

    override function pushRuleComparisonPopup(importEntry: RuleImportTaskEntry, importHelper: RuleExportImportPageHelper) {
      CCRuleComparisonPopup.push(_parentContext, importEntry, importHelper)
    }

    override function pushRuleComparisonEditPopup(importEntry: RuleImportTaskEntry, importHelper: RuleExportImportPageHelper, chosenSide: RuleImportSide) {
      CCRuleEditPopup.push(_parentContext, importEntry, importHelper, chosenSide)
    }

    override property get UIConfigs(): Map<RuleActionKey, CommandDefinitionUIConfig> {
      return AllUIConfigs
    }

    private property get AllUIConfigs(): Map<RuleActionKey, CommandDefinitionUIConfig> {
      var map = Maps.newHashMap<RuleActionKey, CommandDefinitionUIConfig>()
      BizRulesContexts.Contexts.map(\ctx -> ctx.UIConfigs).each(\ctx -> map.putAll(ctx))
      return map
    }

    override function goToRulesListPage(ruleTypeRef: typekey.Rule) {
      throw new UnsupportedOperationException("The rule type ${ruleTypeRef} is not supported. Please update BizRulesContexts.")
    }

    override function goToRulesListPage() {
      throw new UnsupportedOperationException()
    }

    override function goToCreateRulePage() {
      throw new UnsupportedOperationException()
    }

    override function goToRuleDetailPage(version: RuleVersion) {
      throw new UnsupportedOperationException()
    }

    override property get RuleFilterCriteria(): CCRuleFilterCriteria<CCRule> {
      throw new UnsupportedOperationException()
    }

    override property get DefaultRuleConditionType(): RuleConditionType {
      throw new UnsupportedOperationException()
    }

    override property get RuleType(): typekey.Rule {
      throw new UnsupportedOperationException()
    }

    protected override function goToCloneTypedRulePage(ruleToClone: CCRule) {
      throw new UnsupportedOperationException()
    }

    override function createCommandDefinition(controller: CommandDefinitionController, ruleActions: List<RuleActionKey>): RuleCommandDefinitionHolder {
      throw new UnsupportedOperationException()
    }
  }
}

