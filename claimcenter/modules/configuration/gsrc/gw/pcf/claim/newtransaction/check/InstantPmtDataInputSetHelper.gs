package gw.pcf.claim.newtransaction.check

uses gw.api.phone.ContactPhoneDelegate
uses gw.api.phone.StandardPhoneOwner

@Export
class InstantPmtDataInputSetHelper {

  static function createCellPhoneDelegate(check : Check) : ContactPhoneDelegate {
    var payee = check.FirstPayee.Payee
    if (payee != null and payee typeis Person) {
      return new ContactPhoneDelegate(payee, payee#CellPhone)
    }
    return null
  }

  static function getStandardPhoneOwner(check : Check) : StandardPhoneOwner {
    return new gw.api.phone.StandardPhoneOwner(createCellPhoneDelegate(check))
  }
}