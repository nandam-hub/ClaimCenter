package gw.typelist

uses entity.Contact
uses gw.api.phone.ContactPhoneDelegate
uses gw.api.phone.StandardPhoneOwner
uses gw.lang.reflect.features.PropertyReference

@Export
enhancement PreferredPhoneNumberTypeEnhancement : PreferredPhoneNumberType {
  function readValueFromContact(contact : Contact) : String {
    switch (this) {
      case TC_DO_NOT_CALL: return PreferredPhoneNumberType.TC_DO_NOT_CALL.DisplayName
      case TC_DO_NOT_TEXT: return PreferredPhoneNumberType.TC_DO_NOT_TEXT.DisplayName
      case TC_HOME:        return getNationalSubscriberNumber(contact, Contact#HomePhone)
      case TC_MOBILE:      return (contact typeis Person ? getNationalSubscriberNumber(contact, Person#CellPhone) : null)
      case TC_WORK:        return getNationalSubscriberNumber(contact, Contact#WorkPhone)
    }
    return null
  }

  function isAvailableForContact(contact : Contact) : boolean {
    return this == TC_DO_NOT_CALL or this == TC_DO_NOT_TEXT or (readValueFromContact(contact) != null)
  }

  private function getNationalSubscriberNumber(contact : Contact, propRef: PropertyReference) : String {
    return new StandardPhoneOwner(new ContactPhoneDelegate(contact, propRef), null, false).PhoneFields.NationalSubscriberNumber
  }

}