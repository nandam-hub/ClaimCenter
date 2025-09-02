package gw.typelist

uses entity.Contact

@Export
enhancement PreferredEmailTypeEnhancement : PreferredEmailType {
  function readValueFromContact(contact : Contact) : String {
    switch (this) {
      case TC_EMAIL_ADDRESS_1:  return contact.EmailAddress1
      case TC_EMAIL_ADDRESS_2:  return contact.EmailAddress2
      case TC_NO_EMAIL_UPDATES: return PreferredEmailType.TC_NO_EMAIL_UPDATES.DisplayName
    }
    return null
  }

  function isAvailableForContact(contact : Contact) : boolean {
    return this == TC_NO_EMAIL_UPDATES or (readValueFromContact(contact) != null)
  }
}