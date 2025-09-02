package edge.capabilities.claim.contact
uses edge.di.annotations.ForAllGwNodes
uses edge.capabilities.claim.address.IClaimAddressPlugin
uses edge.security.authorization.IAuthorizerProviderPlugin
uses edge.util.mapping.RefUpdater
uses edge.util.mapping.Mapper
uses edge.capabilities.claim.contact.dto.ContactDTO
uses edge.capabilities.claim.contact.dto.ClaimContactDTO

/**
 * Default claim contact implementations.
 */
class DefaultClaimContactPlugin implements IClaimContactPlugin {

  private var _addressPlugin: IClaimAddressPlugin

  private var _claimContactUpdater : RefUpdater<Claim,ClaimContact,ContactDTO> as readonly ClaimContactUpdater
  private var _mapper : Mapper as Mapper

  @ForAllGwNodes
  @Param("claimContactAuthorizer", "Plugin used to check claim contact access")
  @Param("addressPlugin", "Plugin used to convert claim contact address")
  construct(addressPlugin : IClaimAddressPlugin, authorizerProvider:IAuthorizerProviderPlugin) {
    this._addressPlugin = addressPlugin
    this._mapper = new Mapper(authorizerProvider)
    this._claimContactUpdater = new RefUpdater<Claim,ClaimContact,ContactDTO>(authorizerProvider) {
      : ToCreate = \ claim,d:ContactDTO -> {
        var cc = new ClaimContact()
        cc.Contact = new Person()
        claim.addToContacts(cc)
        return cc
      },
      : EntityKey = \ e -> e.Contact.PublicID,
      : AllowedValues =  \ claim -> claim.Contacts
    }
  }

  override function toDTO(contact : ClaimContact) : ClaimContactDTO {
    return Mapper.mapRef(contact, \ c -> claimContactToDTO(c) )
  }

  override function toDTO(contacts : ClaimContact[]) : ClaimContactDTO[] {
    return Mapper.mapArray(contacts, \ c -> claimContactToDTO(c))
  }

  override function toContactDTO(contact : ClaimContact) : ContactDTO {
    return Mapper.mapRef(contact, \ c -> contactToDTO(c))
  }

  override function toContactDTO(contacts : ClaimContact[]) : ContactDTO[] {
     return Mapper.mapArray(contacts, \ c -> contactToDTO(c))
  }

  override function getUpdatedContact(claim:Claim, dto : ContactDTO) : Contact {
    return _claimContactUpdater.updateRef(claim, dto,\ c, d -> updateContact(claim,c.Contact,d)).Contact
  }

  override function getUpdatedContact(claim:Claim, contact: Contact, dto : ContactDTO) : Contact {
    updateContact(claim,contact,dto)
    return contact
  }

  /**
   * Converts contact into DTO. Do not perform access checks.
   */
  protected function claimContactToDTO(claimContact : ClaimContact) : ClaimContactDTO {
    final var res = new ClaimContactDTO()
    fillBaseProperties(res, claimContact)
    res.ContactDTO = contactToDTO(claimContact)
    return res
  }

  protected function contactToDTO(claimContact: ClaimContact) : ContactDTO {
    final var dto = new ContactDTO()
    fillBaseProperties(dto, claimContact.Contact)
    dto.PrimaryAddress = _addressPlugin.toDTO(claimContact.Claim, claimContact.Contact.PrimaryAddress)
    dto.PolicyRole = getContactPolicyRole(claimContact)
    return dto
  }

  protected function updateContact(claim : Claim, contact : Contact, dto : ContactDTO) {
    updateBaseProperties(contact, dto)
    contact.PrimaryAddress = _addressPlugin.getUpdatedAddress(claim, dto.PrimaryAddress)
  }

  /**
   * Returns policy roles for the given contact.
   */
  protected function getContactPolicyRole(contact : ClaimContact) : ContactRole {
    var claim = contact.Claim
    if (claim.Policy.insured == contact.Contact ) {
      return ContactRole.TC_INSURED
    } else if (claim.Policy.coveredparty.contains(contact.Contact) ) {
      return ContactRole.TC_COVEREDPARTY
    } else {
      return null
    }
  }

  /**
   * Fills base ("primitive") properties on the contact DTO.
   */
  public static function fillBaseProperties(dto : ClaimContactDTO, contact : ClaimContact) {
    dto.PublicID = contact.PublicID
    dto.ContactRoles = contact.Roles*.Role
    dto.ContactRolesDisplay = contact.Roles.map(\ r -> r.DisplayName)
  }

  /**
   * Updates base properties on the DTO.
   */
  public static function fillBaseProperties(dto : ContactDTO, contact : Contact) {
    DefaultContactPlugin.fillBaseProperties(dto, contact)
  }

   /**
   * Sets base properties on the contact.
   */
  public static function updateBaseProperties(contact : Contact, dto : ContactDTO) {
    DefaultContactPlugin.updateBaseProperties(contact, dto)
  }
}
