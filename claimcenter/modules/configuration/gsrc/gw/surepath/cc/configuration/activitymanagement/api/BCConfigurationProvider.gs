package gw.surepath.cc.configuration.activitymanagement.api

uses javax.xml.namespace.QName

uses gw.surepath.suite.configuration.annotation.IncludeInDocumentation
uses gw.xml.ws.WsdlConfig
uses gw.xml.ws.IWsiWebserviceConfigurationProvider

/**
 * Activity Management: Used for configuring the provider used on web service calls
 */
@Export
@IncludeInDocumentation
class BCConfigurationProvider implements IWsiWebserviceConfigurationProvider {

  /**
   * Sets the credentials for the provider used on web service calls
   * TODO: You MUST replace this with a proper authentication service integration
   * @param serviceName
   * @param portName
   * @param config
   */
  @IncludeInDocumentation
  override function configure(serviceName : QName, portName : QName, config : WsdlConfig) {
    config.Guidewire.Authentication.Username = "pu"
    config.Guidewire.Authentication.Password = "gw"
  }
}
