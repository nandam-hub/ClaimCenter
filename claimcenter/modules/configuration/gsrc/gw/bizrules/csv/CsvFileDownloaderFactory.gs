package gw.bizrules.csv

uses gw.bizrules.csv.reserverule.ReserveRuleConfiguration
uses typekey.*
uses typekey.Rule
uses sun.reflect.generics.reflectiveObjects.NotImplementedException

/**
 * Factory class which provides instance of {@link gw.bizrules.csv.CsvFileDownloader}
 * for a give rule of type {@code ruleType}
 */
@Export
class CsvFileDownloaderFactory {
  /**
   * Returns instance of {@link gw.bizrules.csv.CsvFileDownloader} for a given rule type {@code ruleType}
   * @param ruleType type of Biz Rule
   * @return instance of a class which downloads CSV file for the given rule type {@code ruleType}
   */
  static function downloaderFor(ruleType: typekey.Rule): CsvFileDownloader {
    switch (ruleType) {
      case Rule.TC_RESERVERULE:
        var appcriteriaFactory = new AppCriteriaFactoryImpl()
        var reserveRuleConfiguration = new ReserveRuleConfiguration(appcriteriaFactory)
        var ruleConfiguration = new RuleConfiguration(reserveRuleConfiguration.Columns)
        return new CsvFileDownloader<ReserveRule>(ruleConfiguration, "ReserveRules.csv")
      default:
        throw new NotImplementedException()
    }
  }
}