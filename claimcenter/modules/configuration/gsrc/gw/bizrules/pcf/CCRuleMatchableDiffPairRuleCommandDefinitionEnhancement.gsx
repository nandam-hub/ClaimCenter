package gw.bizrules.pcf

uses gw.api.locale.DisplayKey
uses gw.api.util.LocaleUtil
uses gw.bizrules.BizRulesComponentMapper
uses gw.bizrules.IRuleAction
uses gw.bizrules.diff.RuleMatchableDiffPair
uses gw.entity.TypeKey

@Export
enhancement CCRuleMatchableDiffPairRuleCommandDefinitionEnhancement : RuleMatchableDiffPair<RuleCommandDefinition> {
  function getLocalizedRow(language : LanguageType, parameterName : String): RuleComparisonRow<String> {
    var localizedParameterName = language == LocaleUtil.DefaultLanguageType
        ? parameterName
        : language.localizedNameForBaseField(parameterName)

    var label = DisplayKey.get("Web.BizRules.Rule.ComparisonLocalizedRowLabel", language.DisplayName)

    var lhs = this.Left.RuleCommandParameters.ParameterMap[localizedParameterName].Expression
    var rhs = this.Right.RuleCommandParameters.ParameterMap[localizedParameterName].Expression

    var fieldsMatch = this.DiffType == NONE or (this.DiffType == MOD and lhs.equalsTo(rhs))

    return new gw.bizrules.pcf.RuleComparisonRow<String>(label, !fieldsMatch, {lhs.DisplayText, rhs.DisplayText})
  }

  function getRowAsTypeKey(parameterName : String) : gw.bizrules.pcf.RuleComparisonRow<TypeKey> {
    var label = Action.CommandParameterDefinitions[parameterName].ParameterLabel

    var lhs = this.Left.RuleCommandParameters.ParameterMap[parameterName].Expression as TypeKeyExpressionFragment
    var rhs = this.Right.RuleCommandParameters.ParameterMap[parameterName].Expression as TypeKeyExpressionFragment

    var fieldsMatch = this.DiffType == NONE or (this.DiffType == MOD and lhs.equalsTo(rhs))

    return new gw.bizrules.pcf.RuleComparisonRow<gw.entity.TypeKey>(label, !fieldsMatch, {lhs.TypeKeyValue, rhs.TypeKeyValue})
  }

  function getRowAsInteger(parameterName : String) : gw.bizrules.pcf.RuleComparisonRow<Integer> {
    var label = Action.CommandParameterDefinitions[parameterName].ParameterLabel

    var lhs = this.Left.RuleCommandParameters.ParameterMap[parameterName].Expression
    var rhs = this.Right.RuleCommandParameters.ParameterMap[parameterName].Expression

    var fieldsMatch = this.DiffType == NONE or (this.DiffType == MOD and lhs.equalsTo(rhs))

    return new gw.bizrules.pcf.RuleComparisonRow<Integer>(label, !fieldsMatch, {lhs.IntegerValue, rhs.IntegerValue})
  }

  function getRowAsBoolean(parameterName : String) : gw.bizrules.pcf.RuleComparisonRow<Boolean> {
    var label = Action.CommandParameterDefinitions[parameterName].ParameterLabel

    var lhs = this.Left.RuleCommandParameters.ParameterMap[parameterName].Expression
    var rhs = this.Right.RuleCommandParameters.ParameterMap[parameterName].Expression

    var fieldsMatch = this.DiffType == NONE or (this.DiffType == MOD and lhs.equalsTo(rhs))

    return new gw.bizrules.pcf.RuleComparisonRow<Boolean>(label, !fieldsMatch, {lhs.BooleanValue, rhs.BooleanValue})
  }

  function isRowEmpty(parameterName : String) : boolean {
    var lhs = this.Left.RuleCommandParameters.ParameterMap[parameterName].Expression.DisplayText
    var rhs = this.Right.RuleCommandParameters.ParameterMap[parameterName].Expression.DisplayText
    return !(lhs.HasContent or rhs.HasContent)
  }

  private property get Command() : RuleCommandDefinition {
    return this.Left ?: this.Right
  }

  private property get Action() : IRuleAction {
    return BizRulesComponentMapper.Instance.getRuleAction(Command.RuleActionKey)
  }
}
