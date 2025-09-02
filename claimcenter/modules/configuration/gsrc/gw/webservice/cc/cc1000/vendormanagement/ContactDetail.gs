package gw.webservice.cc.cc1000.vendormanagement

uses gw.xml.ws.annotation.WsiExportable
uses entity.Contact

@Export
@WsiExportable("http://guidewire.com/cc/ws/gw/webservice/cc/cc1000/vendormanagement/ContactDetail")
final class ContactDetail {

  /**
   * The summary of the Contact
  */
  var _contactSummary : ContactSummary as ContactSummary

  /**
  * The CC DisplayName of the Contact's Address
  */
  var _address : String as Address

  public construct() {}

  public construct(contact : Contact) {
    Address = new gw.api.address.AddressFormatter().format(contact.PrimaryAddress, "\n")
    ContactSummary = new ContactSummary(contact)
  }
}