package gw.bizrules

uses gw.bizrules.ActivityRules.ActivityRulesNavigationContext
uses gw.bizrules.ExposureRules.ExposureRulesNavigationContext
uses gw.bizrules.ReserveRules.ReserveRulesNavigationContext

/**
 * Container of all the biz rules navigation contexts in the system
 */
@Export
class BizRulesContexts {
  public static property get Contexts(): List<CCRulesNavigationContext<CCRule>> {
    return {
        ActivityRulesNavigationContext.Instance,
        ExposureRulesNavigationContext.Instance,
        ReserveRulesNavigationContext.Instance
    }
  }
}