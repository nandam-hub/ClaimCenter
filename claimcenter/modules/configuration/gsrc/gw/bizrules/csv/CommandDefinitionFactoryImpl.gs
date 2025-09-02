package gw.bizrules.csv

uses gw.bizrules.CCRulesDetailsStateHolder
uses gw.bizrules.CCRulesNavigationContext
uses gw.bizrules.pcf.RulePageController
uses pcf.api.Location

/**
 * Factory for creating Rule Command Definitions (Actions)
 */
@Export
class CommandDefinitionFactoryImpl implements CommandDefinitionFactory {
  private final var _context: CCRulesNavigationContext
  private final var _location: Location

  construct(context: CCRulesNavigationContext, location: Location) {
    _context = context
    _location = location
  }

  override function addCommandDefintion(head : RuleHead) : RuleCommandDefinition {
    var rulePageController = new RulePageController(head.HeadVersion, _context.UIConfigs, _location, CCRulesDetailsStateHolder.SwitchableModes)
    return rulePageController.CommandDefinitionController.addCommandDefinition().CommandDefinition
  }
}