package gw.bizrules.ExposureRules

uses gw.bizrules.CCRuleFilterCriteriaBase
uses gw.bizrules.CCRulesListPageHelper
uses gw.bizrules.ExposureRulesListPageHelper

/**
 * Class to manage the Exposure Rules Search Panel Filter Criteria - This stores all the criteria
 * used to create a filter
 */
@Export
class ExposureRuleFilterCriteria extends CCRuleFilterCriteriaBase<ExposureRule> {
  /**
   * Default Constructor
   */
  construct() {
    super(typekey.Rule.TC_EXPOSURERULE)
  }

  override property get PageHelper(): CCRulesListPageHelper<ExposureRule> {
    return new ExposureRulesListPageHelper()
  }
}