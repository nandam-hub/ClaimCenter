package gw.api.databuilder.bizrules

uses gw.bizrules.databuilder.ExpressionFragmentBuilders
uses gw.bizrules.ruleaction.createexposure.config.ExposureCommandParameterConfig
uses gw.bizrules.ruleaction.createexposure.config.ExposureCommandParameterSet

@Export
class ExposureCommandDefinitionBuilder extends CCRuleCommandDefinitionBuilder<ExposureCommandDefinitionBuilder, ExposureCommandParameterConfig> {

  construct() {
    super(RuleActionKey.TC_CREATEEXPOSURE)
    withIncidentContextParameter()
  }

  function withIncidentContextParameter(): ExposureCommandDefinitionBuilder {
    addToMap(Config.INCIDENT, ExpressionFragmentBuilders.forCodeExpression("incident"))
    return this
  }

  function withCoverageType(coverageType: CoverageType): ExposureCommandDefinitionBuilder {
    addToMap(Config.COVERAGE_TYPE, ExpressionFragmentBuilders.forTypeKeyExpression(coverageType))
    return this
  }

  function withCoverageSubType(coverageSubtype: CoverageSubtype): ExposureCommandDefinitionBuilder {
    addToMap(Config.COVERAGE_SUBTYPE, ExpressionFragmentBuilders.forTypeKeyExpression(coverageSubtype))
    return this
  }

  protected override property get Config(): ExposureCommandParameterConfig {
    return ExposureCommandParameterSet.Config
  }
}
