package edge.capabilities.claim.fnol.contact
uses edge.capabilities.claim.fnol.dto.FnolRelatedContactDTO
uses edge.di.annotations.ForAllGwNodes
uses edge.capabilities.claim.contact.IClaimContactPlugin
uses java.lang.IllegalArgumentException
uses edge.util.mapping.ArrayUpdater
uses edge.security.authorization.IAuthorizerProviderPlugin
uses edge.util.mapping.Mapper

/**
 * Default implementation of FNOL contact plugin.
 */
class DefaultFnolContactPlugin implements IFnolContactPlugin {
  
  private static final var SUPPORTED_ROLES = new ContactRole[]{ContactRole.TC_WITNESS, ContactRole.TC_OTHER}
  
  private var _claimContactPlugin :  IClaimContactPlugin

  private var _updater : ArrayUpdater<Claim,ClaimContact,FnolRelatedContactDTO>
  private var _mapper : Mapper as readonly Mapper

  @ForAllGwNodes
  @Param("claimContactPlugin", "Plugin used for claim contact conversion")
  construct(authzProvider: IAuthorizerProviderPlugin, claimContactPlugin : IClaimContactPlugin) {
    this._claimContactPlugin = claimContactPlugin
    this._updater = new ArrayUpdater<Claim,ClaimContact,FnolRelatedContactDTO>(authzProvider) {
      : EntityKey = \ cc -> cc.Contact.PublicID,
      : DtoKey = \ d -> d.Contact.PublicID,
      : AllowedValues = \ claim -> claim.Contacts,
      : ToCreateAndAdd = \ claim, dto -> {
        var cc = new ClaimContact()
        cc.Contact = new Person()
        claim.addToContacts(cc)
        return cc
      },
      : ToAdd = \ claim, cc -> { /* Do nothing, a role will be asigned later */ },
      : ToRemove = \ claim, cc -> {
        removeRoles(claim,cc.Contact,SUPPORTED_ROLES)
        var injuryIncident = findInjury(cc)
        if ( injuryIncident != null ) {
          claim.removeFromIncidents(injuryIncident)
        }
      }
    }
    this._mapper = new Mapper(authzProvider)
  }

  override function toDTO(claim:Claim, contacts : ClaimContact[]) : FnolRelatedContactDTO[] {
    return Mapper.mapArray(claim.getClaimContactsByRoles(SUPPORTED_ROLES),\ cc -> {
      var res = new FnolRelatedContactDTO()
      res.PublicID = cc.Contact.PublicID
      res.Contact = _claimContactPlugin.toContactDTO(cc)
      res.Role = primaryRoleOf(cc)
      res.Injured = findInjury(cc) != null
      return res
    })
  }
  
  
  
  /**
   * Updates contacts to match list of DTOs.
   */
  override function updateContacts(claim : Claim, contacts : ClaimContact[], dtos : FnolRelatedContactDTO[]) {
    _updater.updateArray(claim,claim.getClaimContactsByRoles(SUPPORTED_ROLES), dtos,\ cc, dto -> {
      cc.Contact = _claimContactPlugin.getUpdatedContact(claim,cc.Contact,dto.Contact)
      setUniqueRole(claim,cc.Contact,dto.Role)

      var injury = findInjury(cc)
      if ( dto.Injured ) {
        if ( injury == null ) {
          addInjury(claim,cc.Contact)
        }
      } else {
        if ( injury != null ) {
          claim.removeFromIncidents(injury)
        }
      }
    })
  }

  protected function findInjury(cc:ClaimContact) : InjuryIncident{
    return cc.Roles.firstWhere( \ cr -> cr.Incident typeis InjuryIncident && cr.Role == ContactRole.TC_INJURED).Incident as InjuryIncident
  }


  protected function removeRoles(claim : Claim, contact : Contact, roles : ContactRole[]) {
    roles.each(\ role -> claim.removeRole(role, contact))
  }  

  /**
   * Sets a new role on the contact.
   */
  protected function setUniqueRole(claim : Claim, contact : Contact, role : ContactRole) {
    if (!SUPPORTED_ROLES.contains(role)) {
      throw new IllegalArgumentException("Attempt to set incorrect role " + role)
    }
    
    removeRoles(claim, contact, SUPPORTED_ROLES.where(\r -> r != role))
    final var cc = claim.addRole(role, contact)
    if (role == ContactRole.TC_WITNESS) {
      cc.WitnessPerspective = "unknown"
      cc.WitnessStatementInd = YesNo.TC_YES
    }
  }
  
  

  /**
   * Adds injury to a claim contact.
   */
  protected function addInjury(claim : Claim, contact : Contact):InjuryIncident {
    final var incident = new InjuryIncident()
    claim.addToIncidents(incident)
    incident.injured = contact as Person
    return incident
  }



  /**
   * Extracts primary role of the contact.
   */
  protected function primaryRoleOf(contact : ClaimContact) : ContactRole {
    if (contact.Roles*.Role.contains(ContactRole.TC_WITNESS)) {
      return ContactRole.TC_WITNESS
    } else if (contact.Roles*.Role.contains(ContactRole.TC_OTHER)) {
      return ContactRole.TC_OTHER
    }
    
    return null
  }

}
