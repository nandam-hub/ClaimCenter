package gw.entity

uses gw.api.locale.DisplayKey
uses gw.plugin.Plugins
uses gw.plugin.contact.OfficialIDMaskPlugin

@Export
enhancement GWOfficialIDEnhancement : OfficialID {

  private property get officalIdMaskPlugin() : OfficialIDMaskPlugin {
    return Plugins.get(OfficialIDMaskPlugin)
  }

  property get isMaskable() : boolean {
    return officalIdMaskPlugin.isMaskable(this.OfficialIDType, null)
  }

  function inputMaskIDValue() : String {
    return officalIdMaskPlugin.getInputMask(this.OfficialIDType, null)
  }

  function outputConversionIDValue(value : String) : String {
    return officalIdMaskPlugin.getOutputConversion(this.OfficialIDType, value, null)
  }

  function validateIDValueInput(value : String) : String {
    if (isMaskable) {
      if (value.length() != inputMaskIDValue().length()) {
        return DisplayKey.get("Web.ContactDetail.OfficialID.ValidationError")
      }
    }
    return null
  }
}
