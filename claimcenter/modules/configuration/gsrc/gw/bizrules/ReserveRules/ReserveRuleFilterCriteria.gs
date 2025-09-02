package gw.bizrules.ReserveRules

uses gw.bizrules.CCRuleFilterCriteriaBase
uses gw.bizrules.CCRulesListPageHelper
uses gw.bizrules.ReserveRulesListPageHelper
uses typekey.*

/**
 * Class to manage the Reserve Rules Search Panel Filter Criteria - This stores all the criteria
 * used to create a filter
 */
@Export
class ReserveRuleFilterCriteria extends CCRuleFilterCriteriaBase<ReserveRule> {
  /**
   * Default Constructor
   */
  construct() {
    super(typekey.Rule.TC_RESERVERULE)
  }

  override property get PageHelper(): CCRulesListPageHelper<ReserveRule> {
    return new ReserveRulesListPageHelper()
  }
}