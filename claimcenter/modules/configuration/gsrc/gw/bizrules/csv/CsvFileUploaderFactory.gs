package gw.bizrules.csv

uses gw.bizrules.CCRuleTypeReference
uses gw.bizrules.CCRulesNavigationContext
uses gw.bizrules.csv.parser.BizRulesCsvParser
uses gw.bizrules.csv.reserverule.ReserveRuleConfiguration
uses pcf.api.Location
uses sun.reflect.generics.reflectiveObjects.NotImplementedException
uses typekey.Rule

/**
 * Factory class which provides instance of {@link CsvFileUploader}
 * for a give navigation context.
 */
@Export
class CsvFileUploaderFactory {
  private final var _context: CCRulesNavigationContext
  private final var _location: Location

  construct(context: CCRulesNavigationContext, location: Location) {
    _context = context
    _location = location
  }

  /**
   * Returns instance of {@link CsvFileUploader} for a rule type inferred from {@code context}
   * @return instance of a class for uploading CSV file of a rule type inferred from {@code context}
   */
  function createUploader(): CsvFileUploader {
    switch (_context.RuleType) {
      case Rule.TC_RESERVERULE:
        var commandDefinitionFactory = new CommandDefinitionFactoryImpl(_context, _location)
        var appcriteriaFactory = new AppCriteriaFactoryImpl()
        var reserveRuleConfiguration = new ReserveRuleConfiguration(appcriteriaFactory)
        var configuration = new RuleConfiguration(reserveRuleConfiguration.Columns)

        var ruleFromCsvFactory = new RuleFromCsvFactory(_context.VersionController,
            configuration, CCRuleTypeReference.forClass(ReserveRule), commandDefinitionFactory)

        var ruleCsvComparator = new RuleCsvComparator(configuration, ruleFromCsvFactory)
        var ruleImporter = new RuleImporter(configuration, ruleCsvComparator, ruleFromCsvFactory)
        var csvParser = new BizRulesCsvParser()
        return new CsvFileUploader(configuration, ruleImporter, csvParser)
      default:
        throw new NotImplementedException()
    }
  }
}