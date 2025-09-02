package gw.bizrules

uses gw.api.locale.DisplayKey
uses gw.bizrules.pcf.RuleComparisonRow
uses gw.entity.TypeKey

@Export
/**
 * This class provides methods to create RuleComparisonRows for use in side-by-side comparison screens.
 * Several default properties are provided for fields common to all CCRules.
 * For specific rule subtypes, use createRow() or createRowForTypelist().
 */
class RuleVersionComparisonHelper<R extends CCRule> {

  private final var _ruleVersions: List<RuleVersion>as readonly RuleVersions

  private final var ALL = (DisplayKey.get('Web.BizRules.Rule.ApplicabilityCriteria.All'))

  construct(versions: List<RuleVersion>) {
    _ruleVersions = versions
  }

  // Convenience properties for generating RuleComparisonRows for CCRule fields
  property get NameRow(): RuleComparisonRow<String> {
    return createRow(DisplayKey.get('Web.BizRules.Rule.Name'), \r -> r.Name)
  }

  property get DescriptionRow(): RuleComparisonRow<String> {
    return createRow(DisplayKey.get("Web.BizRules.Rule.Description"), \r -> r.Description)
  }

  property get ContextRow(): RuleComparisonRow<RuleContextDefinitionKey> {
    return createRow(DisplayKey.get("Web.BizRules.Rule.Context"), \r -> r.RuleContextDefinitionKey)
  }

  property get TriggerRow(): RuleComparisonRow<TriggeringPointKey> {
    return createRow(DisplayKey.get("Web.BizRules.Rule.Trigger"), \r -> r.TriggeringPointKey)
  }

  property get AvailableToRunRow(): RuleComparisonRow<Boolean> {
    return createRow(DisplayKey.get("BizRules.RuleDetailsPage.AvailableToRun"), \r -> r.AvailableToRun)
  }

  property get LossTypeRow(): RuleComparisonRow<String> {
    return createRowForTypelist(DisplayKey.get("Web.BizRules.Rule.ApplicabilityCriteria.LossType"), \r -> r.LossTypes*.LossType)
  }

  property get PolicyTypeRow(): RuleComparisonRow<String> {
    return createRowForTypelist(DisplayKey.get("Web.BizRules.Rule.ApplicabilityCriteria.PolicyType"), \r -> r.PolicyTypes*.PolicyType)
  }

  property get JurisdictionRow(): RuleComparisonRow<String> {
    return createRowForTypelist(DisplayKey.get("Web.BizRules.Rule.ApplicabilityCriteria.Jurisdiction"), \r -> r.Jurisdictions*.Jurisdiction)
  }
  // End CCRule-specific fields

  /**
   * Creates a RuleComparisonRow that compares a field on a rule across two versions.
   * This is intended to compare a scalar field to a scalar field.
   *
   * @param label         the name of the field the resulting comparison row represents
   * @param valueProducer method that extracts from a rule the field being compared
   * @param <T>           the type of the value being compared
   * @return a RuleComparisonRow that compares a field on a rule across two versions
   */
  reified function createRow<T>(label: String, valueProducer(r: R): T): RuleComparisonRow<T> {
    var values = RuleVersions.map(\v -> valueProducer(v.Rule as R))
    return new RuleComparisonRow<T>(label, valuesDiffer(values), values)
  }

  /**
   * Creates a RuleComparisonRow that compares a typekeylist on a rule across two versions.
   * This is intended to compare a list of typekeys to a list of typekeys.
   *
   * @param label         the name of the field the resulting comparison row represents
   * @param valueProducer method that extracts from a rule the list of typekeys being compared
   * @return a RuleComparisonRow that compares a typekey list on a rule across two versions.
   */
  public function createRowForTypelist(label: String, valueProducer(r: R): TypeKey[]): RuleComparisonRow<String> {
    return createRow(label, \v -> join(valueProducer(v)))
  }

  private function join<T extends TypeKey>(keys: T[]): String {
    return keys.IsEmpty
        ? DisplayKey.get('Web.BizRules.Rule.ApplicabilityCriteria.All')
        : keys*.DisplayName.sort().join(", ")
  }

  private reified function valuesDiffer<T>(values: List<T>): boolean {
    var first = values.first()
    return not values.allMatch(\v -> v == first)
  }
}
