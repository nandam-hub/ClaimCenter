package gw.bizrules

uses gw.bizrules.management.BizRulesVersionController
uses gw.bizrules.pcf.RuleExportImportPageHelper
uses gw.cc.bizrules.CCRulesUtil
uses pcf.CCRuleComparisonPopup
uses pcf.CCRuleEditPopup
uses pcf.CCRuleVersionDetailsPopup
uses pcf.CCRulesExportImportStatus

@Export
abstract class CCRulesNavigationContextBase<T extends CCRule> implements CCRulesNavigationContext<T> {

  var _rulePermissionHolder: CCRulePermissions as readonly Perm

  construct() {}

  construct(permissions: CCRulePermissions) {
    this()
    _rulePermissionHolder = permissions
  }

  override property get VersionController(): BizRulesVersionController {
    return CCRulesUtil.VersionController
  }

  override final function goToCreateRulePage(final ruleTypeRef: typekey.Rule) {
    goToCreateRulePage()
  }

  override function gotoCreateLookupPage() {
    //do nothing
  }

  override function shouldDisplayCreateLookupButton(): boolean {
    return false
  }

  property get PageHelper(): CCRulesListPageHelper<T> {
    return RuleFilterCriteria.PageHelper as CCRulesListPageHelper<T>
  }

  property get RuleFactory(): CCRuleFactory<T> {
    return new (CCRuleTypeReference.forClass(T))
  }

  property get ShowCreateActionHint(): boolean {
    return false
  }

  property get CreateActionHintLabel(): String {
    return ""
  }

  abstract protected function goToCloneTypedRulePage(ruleToClone: T)

  function goToCloneRulePage(ruleToClone: entity.Rule) {
    if (ruleToClone typeis T) {
      goToCloneTypedRulePage(ruleToClone)
    } else {
      throw new UnsupportedOperationException()
    }
  }

  function getTriggerEntityValues(ruleSubType: typekey.Rule): List<typekey.RuleContextDefinitionKey> {
    return filterByRuleSubtype(ruleSubType, RuleContextDefinitionKey.AllTypeKeys)
  }

  function getTriggerActionValues(ruleSubType: typekey.Rule, ruleContextDefinitionKey: RuleContextDefinitionKey): List<typekey.TriggeringPointKey> {
    var componentMapper = BizRulesComponentMapper.getInstance()
    return filterByRuleSubtype(ruleSubType, TriggeringPointKey.AllTypeKeys)
        .where(\elt -> componentMapper.isSupportedContextForTriggeringPoint(elt, ruleContextDefinitionKey))
  }

  function pushRuleVersionDetailsPopup(version: RuleVersion, importing: boolean) {
    CCRuleVersionDetailsPopup.push(this, version, importing)
  }

  function pushRuleComparisonPopup(importEntry: RuleImportTaskEntry, importHelper: RuleExportImportPageHelper) {
    CCRuleComparisonPopup.push(this, importEntry, importHelper)
  }

  function pushRuleComparisonEditPopup(importEntry: RuleImportTaskEntry, importHelper: RuleExportImportPageHelper, chosenSide: RuleImportSide) {
    CCRuleEditPopup.push(this, importEntry, importHelper, chosenSide)
  }

  function goToExportImportStatusPage() {
    CCRulesExportImportStatus.go()
  }

  private function filterByRuleSubtype<TYPEKEY extends gw.entity.TypeKey>(ruleSubType: typekey.Rule, all: List<TYPEKEY>): List<TYPEKEY> {
    return ruleSubType == null
        ? {}
        : all.where(\elt -> elt.hasCategory(ruleSubType))
  }
}