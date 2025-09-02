package gw.bizrules

uses gw.bizrules.pcf.ExpressionInputMode
uses gw.bizrules.pcf.RuleConditionLineHolder
uses gw.bizrules.pcf.DefaultRuleDetailsStateHolder
uses gw.bizrules.pcf.RulePageController
uses pcf.api.Location

/**
 * Helper Class for the Rule Details pcf
 */
@Export
class CCRulesDetailsStateHolder extends DefaultRuleDetailsStateHolder {

  /**
   * Method returns the modes for the condition builder on the UI based on the applications
   * requirements
   *
   * @return Set containing the modes for the condition builder
   */
  public static property get SwitchableModes(): Set<ExpressionInputMode> {
    return RuleConditionLineHolder.SWITCHABLE_LINE_EXPRESSION_MODES_SUPERSET
  }

  var _context: CCRulesNavigationContext<CCRule> as readonly Context

  construct(context: CCRulesNavigationContext, head: RuleHead,
            location: Location) {
    super(head, context, context.UIConfigs, location)
    _context = context
  }

  /**
   * Generates a Rule Page Controller to be used by the pcf
   */
  override protected function createRulePageController(ruleVersion: RuleVersion, location: Location): RulePageController {
    return new RulePageController(ruleVersion, _uiConfigs, location, SwitchableModes)
  }
}