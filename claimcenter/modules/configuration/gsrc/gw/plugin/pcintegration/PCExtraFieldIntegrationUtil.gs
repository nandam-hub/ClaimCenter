package gw.plugin.pcintegration

uses gw.util.GosuStringUtil
uses gw.webservice.contactapi.ExtraFieldIntegrationUtil


@Export
class PCExtraFieldIntegrationUtil extends ExtraFieldIntegrationUtil {

  static function remapAllExtraFields(env : CCAddressPayload) {
    if (env != null) {
      for (ccAddress in env.getCCAddress()) {
        if (!GosuStringUtil.isEmpty(ccAddress.ExtraFieldMapping)) {
          remapExtraFields(ccAddress)
        }
      }
    }
  }

}
