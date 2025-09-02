package gw.bizrules

uses java.lang.IllegalStateException

/**
 * Abstract class that is the base of Bizrules builders for Activity Rules
 */
@Export
abstract class DefaultAbstractBizrulesBase {

  /**
   * Method to check if the rule passes bizrules validations
   * @param head RuleHead signifying a rule that needs to be validated
   */
  protected static function isRuleValid(head : RuleHead) {
    if (!head.getHeadVersion().getRule().isValid()) {
      throw new IllegalStateException("Bizrules " + head.getHeadVersion().getRule().getName() + " is not valid")
    }
  }
}