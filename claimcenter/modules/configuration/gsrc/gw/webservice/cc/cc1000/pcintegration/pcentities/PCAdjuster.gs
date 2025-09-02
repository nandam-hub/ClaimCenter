package gw.webservice.cc.cc1000.pcintegration.pcentities

uses gw.xml.ws.annotation.WsiExportable

@WsiExportable("http://guidewire.com/cc/ws/gw/webservice/cc/cc1000/pcintegration/pcentities/PCAdjuster")
@Export
final class PCAdjuster {
  var _displayName: String as DisplayName
  var _primaryPhone: String as PrimaryPhone

  construct(contact: Contact) {
    _displayName = contact.DisplayName
    _primaryPhone = contact.PrimaryPhoneValue
  }

  construct() {
  }
}
