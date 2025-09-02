package edge.capabilities.claim.contact

uses edge.capabilities.address.IAddressPlugin
uses edge.capabilities.claim.contact.dto.ContactDTO
uses edge.di.annotations.ForAllGwNodes
uses edge.security.authorization.IAuthorizerProviderPlugin
uses edge.util.mapping.Mapper
uses edge.util.mapping.RefUpdater

class DefaultContactPlugin implements IContactPlugin {

  private var _addressPlugin: IAddressPlugin
  private var _mapper : Mapper as Mapper
  private var _claimPersonUpdater : RefUpdater<Claim,ClaimContact,ContactDTO> as readonly ClaimPersonUpdater
  private var _claimDoctorUpdater : RefUpdater<Claim,ClaimContact,ContactDTO> as readonly ClaimDoctorUpdater

  @ForAllGwNodes
  @Param("addressPlugin", "Plugin used to convert contact address")
  construct(
      addressPlugin: IAddressPlugin,
      authorizerProvider:IAuthorizerProviderPlugin
  ) {
    this._addressPlugin = addressPlugin
    this._mapper = new Mapper(authorizerProvider)

    this._claimPersonUpdater = new RefUpdater<Claim,ClaimContact,ContactDTO>(authorizerProvider) {
      : ToCreate = \ claim, d:ContactDTO -> {
        var cc = new ClaimContact()
        cc.Contact = new Person() { :PrimaryAddress = new Address() }
        claim.addToContacts(cc)
        return cc
      },
      : EntityKey = \ e -> e.Contact.PublicID,
      : AllowedValues =  \ claim -> claim.Contacts
    }

    this._claimDoctorUpdater = new RefUpdater<Claim,ClaimContact,ContactDTO>(authorizerProvider) {
      : ToCreate = \ claim, d:ContactDTO -> {
        var cc = new ClaimContact()
        cc.Contact = new Doctor()
        claim.addToContacts(cc)
        return cc
      },
      : EntityKey = \ e -> e.Contact.PublicID,
      : AllowedValues =  \ claim -> claim.Contacts
    }
  }

  override function getUpdatedPerson(claim:Claim, dto : ContactDTO) : Person {
    return ClaimPersonUpdater.updateRef(claim, dto,\ c, d -> updateContact(c.Contact, d)).Contact as Person
  }

  override function getUpdatedDoctor(claim:Claim, dto : ContactDTO) : Doctor {
    return ClaimDoctorUpdater.updateRef(claim, dto,\ c, d -> updateContact(c.Contact, d)).Contact as Doctor
  }

  override function toDTO(contact : Contact) : ContactDTO {
    return Mapper.mapRef(contact, \ c -> contactToDTO(c))
  }

  protected function updateContact(contact : Contact, dto : ContactDTO) {
    updateBaseProperties(contact, dto)
    if (dto.PrimaryAddress != null) {
      _addressPlugin.updateFromDTO(contact.PrimaryAddress, dto.PrimaryAddress)
    }
  }

  /**
   * Sets base properties on the contact.
   */
  public static function updateBaseProperties(contact : Contact, dto : ContactDTO) {
    if ( contact typeis Person ) {
      final var person = contact as Person  // Carbon complains on Contact.FirstName
      person.FirstName = dto.FirstName
      person.LastName = dto.LastName
      person.Prefix = dto.Prefix
      person.Suffix = dto.Suffix
      person.MiddleName = dto.MiddleName
      person.CellPhone = dto.CellNumber
      person.DateOfBirth = dto.DateOfBirth
      person.Gender = dto.Gender
      ClaimContactPlatformHelper.updatePersonProperties(person, dto)
    }
    contact.Name = dto.ContactName
    contact.PrimaryPhone = dto.PrimaryPhoneType
    contact.HomePhone = dto.HomeNumber
    contact.WorkPhone = dto.WorkNumber
    contact.EmailAddress1 = dto.EmailAddress1
    contact.TaxID = dto.TaxID
  }

  protected function contactToDTO(contact: Contact) : ContactDTO {
    final var dto = new ContactDTO()
    fillBaseProperties(dto, contact)
    if (contact.PrimaryAddress != null) {
      dto.PrimaryAddress = _addressPlugin.toDto(contact.PrimaryAddress)
    }
    return dto
  }

  /**
   * Updates base properties on the DTO.
   */
  public static function fillBaseProperties(dto : ContactDTO, contact : Contact) {
    dto.PublicID = contact.PublicID
    dto.AddressBookUID = contact.AddressBookUID
    dto.Subtype = contact.Subtype.Code
    dto.DisplayName = contact.DisplayName

    if(contact typeis CompanyVendor){
      dto.ContactType = "CompanyVendor"
    } else if(contact typeis PersonVendor){
      dto.ContactType = "PersonVendor"
    } else {
      dto.ContactType = contact.Subtype.Code
    }

    if(contact typeis Person){
      dto.FirstName = contact.FirstName
      dto.LastName = contact.LastName
      dto.Prefix = contact.Prefix
      dto.Suffix = contact.Suffix
      dto.MiddleName = contact.MiddleName
      dto.CellNumber = contact.CellPhone
      dto.DateOfBirth = contact.DateOfBirth
      dto.Gender = contact.Gender
      ClaimContactPlatformHelper.fillPersonProperties(dto, contact)
      if (contact typeis PersonVendor) {
        dto.PrimaryContactName = contact.PrimaryContact.DisplayName
      }
    } else if (contact typeis CompanyVendor) {
      dto.PrimaryContactName = contact.PrimaryContact.DisplayName
    }

    dto.ContactName = contact.Name
    dto.PrimaryPhoneType = contact.PrimaryPhone
    dto.HomeNumber = contact.HomePhone
    dto.WorkNumber = contact.WorkPhone
    dto.FaxNumber = contact.FaxPhone
    dto.EmailAddress1 = contact.EmailAddress1
    dto.TaxID = contact.TaxID
  }
}
