package gw.api.databuilder.bizrules

uses gw.bizrules.databuilder.ExpressionFragmentBuilders
uses gw.bizrules.ruleaction.behavioralcommandparam.relatedto.HasRelatedToCommandParameterConfig

@Export
abstract class HasRelatedToCommandDefinitionBuilder<B extends CCRuleCommandDefinitionBuilder, T extends HasRelatedToCommandParameterConfig>
  extends CCRuleCommandDefinitionBuilder<B, T> {

  construct(key: RuleActionKey) {
    super(key)
  }

  function withRelatedTo(relatedTo : String) : B {
    addToMap(Config.RELATED_TO, ExpressionFragmentBuilders.forGosuTemplateExpression(relatedTo))
    return this as B
  }
}