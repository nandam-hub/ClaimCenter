package gw.plugin.contact

uses gw.api.privacy.EncryptionMaskExpressions

@Export
class OfficialIDMaskPluginImpl implements OfficialIDMaskPlugin {

  static var SSN_MASK_LENGTH = 5
  static var SSN_NUM_VISIBLE = 4
  static var SSN_MASK = "###-##-####"
  static var FEIN_MASK_LENGTH = 6
  static var FEIN_NUM_VISIBLE = 3
  static var FEIN_MASK = "##-#######"

  static internal var maskableOfficialId : HashMap<String, MaskProps> =
      {OfficialIDType.TC_SSN.getCode() -> new MaskProps(SSN_MASK_LENGTH, SSN_NUM_VISIBLE, SSN_MASK),
          OfficialIDType.TC_FEIN.getCode() -> new MaskProps(FEIN_MASK_LENGTH, FEIN_NUM_VISIBLE, FEIN_MASK)}

  override function isMaskable(officialIDType : typekey.OfficialIDType, additionalProperties : Map<String, Object>) : boolean {
    if (officialIDType != null) {
      if (maskableOfficialId.containsKey(officialIDType.Code)) {
        return true
      }
    }
    return false
  }

  override function getInputMask(officialIDType : typekey.OfficialIDType, additionalProperties : Map<String, Object>) : String {
    return isMaskable(officialIDType, additionalProperties) ? getMaskableOfficialIdType(officialIDType).InputMask : ""
  }

  override function getOutputConversion(officialIDType : typekey.OfficialIDType, value : String, additionalProperties : Map<String, Object>) : String {
    if (isMaskable(officialIDType, additionalProperties)) {
      var maskProps = getMaskableOfficialIdType(officialIDType)
      return EncryptionMaskExpressions.maskString(value, maskProps.MaskLength, maskProps.NumVis)
    }
    return value
  }

  private function getMaskableOfficialIdType(officialIDType : typekey.OfficialIDType) : MaskProps {
    return maskableOfficialId.get(officialIDType.Code)
  }

  static class MaskProps {
    var MaskLength : int
    var NumVis : int
    internal var InputMask : String

    construct(maskLen : int, numVis : int, inputMask : String) {
      this.MaskLength = maskLen
      this.NumVis = numVis
      this.InputMask = inputMask
    }
  }
}