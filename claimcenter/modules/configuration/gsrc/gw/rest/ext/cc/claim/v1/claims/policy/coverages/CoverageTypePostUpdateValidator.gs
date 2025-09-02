package gw.rest.ext.cc.claim.v1.claims.policy.coverages

uses gw.api.locale.DisplayKey
uses gw.api.modules.rest.framework.v1.exceptions.LocalizedExceptionUtil
uses gw.api.modules.rest.framework.v1.updater.config.ConfigurationErrorReporter
uses gw.api.modules.rest.framework.v1.updater.config.HandlerConfig
uses gw.api.modules.rest.framework.v1.updater.config.JsonUpdaterConfigurableTypeReference
uses gw.api.modules.rest.framework.v1.updater.handler.ObjectUpdateContext
uses gw.api.modules.rest.framework.v1.updater.validators.PostUpdateValidator
uses gw.api.rest.exceptions.RequestErrorDetails
uses gw.api.rest.swagger.SwaggerParameter

@Export
class CoverageTypePostUpdateValidator implements PostUpdateValidator {

  override function configure(config : HandlerConfig, parseObject : JsonUpdaterConfigurableTypeReference, errorReporter : ConfigurationErrorReporter) {
  }

  override function validate(context : ObjectUpdateContext) {
    var coverage = context.DestRoot as Coverage
    var covTerms = coverage.CovTerms
    var coverageType = coverage.Type
    if (covTerms != null && covTerms.HasElements && coverageType != null) {
      var errorDetails = new ArrayList<RequestErrorDetails>()
      covTerms.each(\covTerm -> {
        if (covTerm.CovTermPattern != null && !covTerm.CovTermPattern.hasCategory(coverageType)) {
          var formattedMessage = DisplayKey.get("Rest.Claim.V1.UnverifiedPolicyCoverage.InvalidCovTermPattern", covTerm.CovTermPattern, covTerm.RestV1_SafeDisplayName, coverageType)
          errorDetails.add(new RequestErrorDetails("body", SwaggerParameter.ParameterLocation.body, null, formattedMessage))
        }
      })
      if (!errorDetails.isEmpty()) {
        throw LocalizedExceptionUtil.badInputWithDetails("Rest.Framework.V1.Resources.ValidationIssuesUserMessage",
            "Rest.Framework.V1.Resources.ValidationIssuesDevMessage", errorDetails)
      }
    }
  }
}