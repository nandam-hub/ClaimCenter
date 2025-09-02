package gw.api.databuilder.bizrules

uses gw.bizrules.databuilder.ExpressionFragmentBuilders
uses gw.bizrules.ruleaction.setfield.config.SetFieldCommandParameterConfig
uses gw.bizrules.ruleaction.setfield.config.SetFieldCommandParameterSet

/**
 * Builder to create a Set Field Rule Action. Please provide all required parameters
 * and ensure that at least one Context Definition (such as Claim, Exposure etc.) is
 * defined.
 */
@Export
class SetFieldCommandDefinitionBuilder extends CCRuleCommandDefinitionBuilder<SetFieldCommandDefinitionBuilder, SetFieldCommandParameterConfig> {

  construct() {
    super(RuleActionKey.TC_SETFIELD)
    withClaimContextParameter()
  }

  function withProperty(prop: String) : SetFieldCommandDefinitionBuilder {
    addToMap(Config.PROPERTY,ExpressionFragmentBuilders.forPropertyReference(prop, false))
    return this
  }

  function withValue(value : String) : SetFieldCommandDefinitionBuilder {
    addToMap(Config.VALUE,ExpressionFragmentBuilders.forCodeExpression(value))
    return this
  }

  function withSetIfNull(setIfNull : boolean) : SetFieldCommandDefinitionBuilder {
    addToMap(Config.SET_ONLY_IF_NULL,ExpressionFragmentBuilders.forCodeExpression(Boolean.toString(setIfNull)))
    return this
  }

  protected override property get Config(): SetFieldCommandParameterConfig {
    return SetFieldCommandParameterSet.Config
  }
}
