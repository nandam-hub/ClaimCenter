package gw.api.databuilder.bizrules

uses gw.bizrules.databuilder.ExpressionFragmentBuilders
uses gw.bizrules.ruleaction.createreserve.config.ReserveCommandParameterConfig
uses gw.bizrules.ruleaction.createreserve.config.ReserveCommandParameterSet

@Export
class ReserveCommandDefinitionBuilder extends CCRuleCommandDefinitionBuilder<ReserveCommandDefinitionBuilder, ReserveCommandParameterConfig> {

  construct() {
    super(RuleActionKey.TC_CREATERESERVE)
    withExposureContextParameter()
  }

  function withCostType(costType: CostType): ReserveCommandDefinitionBuilder {
    addToMap(Config.COST_TYPE, ExpressionFragmentBuilders.forTypeKeyExpression(costType))
    return this
  }

  function withCostCategory(costCategory: CostCategory): ReserveCommandDefinitionBuilder {
    addToMap(Config.COST_CATEGORY, ExpressionFragmentBuilders.forTypeKeyExpression(costCategory))
    return this
  }

  function withAmount(amount: int): ReserveCommandDefinitionBuilder {
    withAmount(amount as String)
    return this
  }

  function withAmount(amountExpression: String): ReserveCommandDefinitionBuilder {
    addToMap(Config.AMOUNT, ExpressionFragmentBuilders.forCodeExpression(amountExpression))
    return this
  }

  function withCurrency(currencyExpression : String): ReserveCommandDefinitionBuilder {
    addToMap(Config.CURRENCY, ExpressionFragmentBuilders.forCodeExpression(currencyExpression))
    return this
  }

  function withCurrency(currency : Currency) : ReserveCommandDefinitionBuilder {
    addToMap(Config.CURRENCY, ExpressionFragmentBuilders.forTypeKeyExpression(currency))
    return this
  }

  function withComments(comments: String): ReserveCommandDefinitionBuilder {
    addToMap(Config.COMMENTS, ExpressionFragmentBuilders.forGosuTemplateExpression(comments))
    return this
  }

  function withRespectFinancialHolds(value: boolean): ReserveCommandDefinitionBuilder {
    addToMap(Config.RESPECT_FINANCIAL_HOLDS, ExpressionFragmentBuilders.forCodeExpression(value as String))
    return this
  }

  protected override property get Config(): ReserveCommandParameterConfig {
    return ReserveCommandParameterSet.Config
  }
}
