package edge.util.helper

class PhoneUtil {

  static function format(phoneNumber:String) : String {
    return gw.api.util.PhoneUtil.format(phoneNumber,gw.api.util.PhoneUtil.UserDefaultPhoneCountry)
  }
}
