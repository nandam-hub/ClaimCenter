package gw.rest.ext.cc.claim.v1.claims.injuryincidents.medicaldiagnosis

uses gw.api.modules.rest.framework.v1.exceptions.LocalizedExceptionUtil
uses gw.api.modules.rest.framework.v1.updater.config.ConfigurationErrorReporter
uses gw.api.modules.rest.framework.v1.updater.config.HandlerConfig
uses gw.api.modules.rest.framework.v1.updater.config.JsonUpdaterConfigurableTypeReference
uses gw.api.modules.rest.framework.v1.updater.handler.ObjectUpdateContext
uses gw.api.modules.rest.framework.v1.updater.validators.PostUpdateValidator

@Export
class MedicalDiagnosisProviderValidator implements PostUpdateValidator {
  override function configure(config : HandlerConfig, parseObject : JsonUpdaterConfigurableTypeReference, errorReporter : ConfigurationErrorReporter) {

  }

  override function validate(context : ObjectUpdateContext) {
    var diagnosis = context.DestRoot as InjuryDiagnosis
    var provider = diagnosis.Contact
    if (provider.getSubtype() != typekey.Contact.TC_DOCTOR) {
      throw LocalizedExceptionUtil.badInput("Rest.Claim.V1.Claims.InjuryIncident.MedicalDiagnosis.ProviderIncorrectType",
          {provider.RestV1_AsReference.Id, provider.getSubtype().getCode(), typekey.Contact.TC_DOCTOR.getCode()});
    }
  }
}