package gw.rest.ext.cc.common.v1.contact

uses gw.api.privacy.EncryptionMaskExpressions
uses gw.plugin.Plugins
uses gw.plugin.contact.OfficialIdToTaxIdMappingPlugin
uses gw.rest.core.pl.common.v1.contacts.IContactEnhancementExtensions

@Export
class ContactEnhancementExtensionsImpl implements IContactEnhancementExtensions {

  override function maskTaxId(contact : Contact, taxId : String) : String {
    return EncryptionMaskExpressions.maskTaxId(taxId)
  }

  override function setTaxId(contact : Contact, taxId : String) {
    contact.TaxID = taxId
    var officialIdType = Plugins.get(OfficialIdToTaxIdMappingPlugin).getOfficialIDTypeForContactTaxId(contact)
    if (officialIdType != null) {
      contact.setOfficialID(officialIdType, taxId)
    }
  }
}