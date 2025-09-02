package gw.bizrules.ActivityRules

uses gw.api.database.ISelectQueryBuilder
uses gw.api.database.Relop
uses gw.bizrules.ActivityRulesListPageHelper
uses gw.bizrules.CCRuleFilterCriteriaBase
uses gw.bizrules.CCRulesListPageHelper
uses gw.bizrules.ruleaction.generateactivity.config.GenerateActivityCommandParameterSet
uses gw.bizrules.ruleaction.generatehistoryevent.HistoryTypeWrapper
uses gw.bizrules.ruleaction.generatehistoryevent.config.GenerateHistoryEventCommandParameterSet
uses gw.bizrules.ruleaction.setfield.config.SetFieldCommandParameterSet
uses typekey.*

/**
 * Class to manage the Activity Rules Search Panel Filter Criteria - This stores all the criteria
 * used to create a filter
 */
@Export
class ActivityRuleFilterCriteria extends CCRuleFilterCriteriaBase<ActivityRule> {
  /**
   * Filter Fields
   */
  var _activityPattern: String as ActivityPattern
  var _historyEventType: HistoryTypeWrapper as HistoryEventType
  var _expression: String as Expression

  /**
   * Default Constructor
   */
  construct() {
    super(typekey.Rule.TC_ACTIVITYRULE)
  }

  override property get PageHelper(): CCRulesListPageHelper<ActivityRule> {
    return new ActivityRulesListPageHelper()
  }

  /**
   * Clears out all the filter variables
   */
  override function clear() {
    super.clear()
    _activityPattern = null
    _historyEventType = null
    _expression = null
  }


  /**
   * Main method to create the rule query using the filters
   *
   * @param query
   */
  override function apply(query: ISelectQueryBuilder<ActivityRule>) {
    super.apply(query)

    if (!Specified or RuleActionKey == null) {
      return
    }

    var subselectRestriction = query.subselect(Rule#ID, CompareIn, RuleCommandDefinition#Rule)
        .compare(RuleCommandDefinition#RuleActionKey, Relop.Equals, RuleActionKey)
        .join(RuleCommandParameter#RuleCommandDefinition)

    switch (RuleActionKey) {
      case RuleActionKey.TC_GENERATEACTIVITY:
        var r = subselectRestriction.compare(RuleCommandParameter#ParameterName, Relop.Equals, GenerateActivityCommandParameterSet.Config.PATTERN.Name)
        if (_activityPattern != null) {
          r.join(RuleCommandParameter#Expression)
              .cast(CodeExpressionFragment)
              .compare(CodeExpressionFragment#CodeText, Relop.Equals, '"' + _activityPattern + '"')
        }
        break
      case RuleActionKey.TC_GENERATEHISTORYEVENT:
        if (_historyEventType != null) {
          var code = ""
          var r = subselectRestriction.compare(RuleCommandParameter#ParameterName, Relop.Equals, GenerateHistoryEventCommandParameterSet.Config.TYPE.Name)
          if (_historyEventType.Type != null) {
            code = _historyEventType.Type.Code
          } else if (_historyEventType.CustomType != null) {
            code = _historyEventType.CustomType.Code
          }
          r.join(RuleCommandParameter#Expression)
              .cast(TypeKeyExpressionFragment)
              .compare(TypeKeyExpressionFragment#Code, Relop.Equals, code)
        }
        break
      case RuleActionKey.TC_SETFIELD:
        var r = subselectRestriction.compare(RuleCommandParameter#ParameterName, Relop.Equals, SetFieldCommandParameterSet.Config.PROPERTY.Name)
        if (_expression != null) {
          r.join(RuleCommandParameter#Expression)
              .cast(PropertyReferenceExpressionFragment)
              .contains(PropertyReferenceExpressionFragment#FullPropertyDenorm, _expression, true)
        }
        break
      case null:
        break
      default:
        throw new Exception("Unknown RuleActionKey")
    }
  }
}
