package gw.bizrules.pcf

uses gw.api.locale.DisplayKey
uses gw.bizrules.BizRulesComponentMapper
uses gw.bizrules.IRuleAction
uses gw.bizrules.diff.RuleMatchableDiffPair

enhancement GWRuleMatchableDiffPairRuleVariableEnhancement: RuleMatchableDiffPair<RuleVariable> {

  property get Rows(): List<RuleComparisonRow<String>> {
    return {NameRow, DescriptionRow, ExpressionRow}
  }

  property get NameRow(): RuleComparisonRow<String> {
    var lhs = this.Left?.Name
    var rhs = this.Right?.Name
    var diff = this.DiffType == NONE ? false : this.DiffType == MOD ? lhs != rhs : true
    return new RuleComparisonRow<String>(DisplayKey.get("BizRules.RuleVariableLV.Name"), diff, {lhs, rhs})
  }

  property get DescriptionRow(): RuleComparisonRow<String> {
    var lhs = this.Left?.Description
    var rhs = this.Right?.Description
    var diff = this.DiffType == NONE ? false : this.DiffType == MOD ? lhs != rhs : true
    return new RuleComparisonRow<String>(DisplayKey.get("BizRules.RuleVariableLV.Description"), diff, {lhs, rhs})
  }

  property get ExpressionRow(): RuleComparisonRow<String> {
    var lhs = this.Left?.Expression
    var rhs = this.Right?.Expression
    var diff = this.DiffType == NONE ? false : this.DiffType == MOD ? not lhs.equalsTo(rhs) : true
    return new RuleComparisonRow<String>(DisplayKey.get("BizRules.RuleVariableLV.Expression"), diff, {lhs.DisplayText, rhs.DisplayText})
  }
}
