package edge.capabilities.claim.fnol.local

uses edge.di.annotations.ForAllGwNodes
uses java.lang.IllegalArgumentException
uses edge.capabilities.claim.policy.IPolicyPlugin
uses edge.capabilities.claim.notes.IClaimNotePlugin
uses edge.capabilities.claim.contact.IClaimContactPlugin
uses edge.capabilities.claim.document.IClaimDocumentPlugin
uses edge.capabilities.address.DefaultAddressPlugin
uses edge.capabilities.claim.fnol.contact.IFnolContactPlugin
uses edge.capabilities.note.dto.NoteDTO
uses edge.capabilities.claim.lob.fnol.ILobFnolPlugin
uses edge.capabilities.claim.lob.fnol.dto.FnolLobDTO
uses edge.capabilities.claim.address.IClaimAddressPlugin
uses edge.util.mapping.Mapper
uses edge.security.authorization.IAuthorizerProviderPlugin
uses edge.capabilities.claim.fnol.dto.FnolDTO
uses edge.capabilities.address.dto.AddressDTO
uses edge.capabilities.claim.fnol.local.IFnolPlugin

/**
 * Default implementation of fnol Plugin.
 */
class DefaultFnolPlugin implements IFnolPlugin {

  /**
   * Plugin used for policy conversion.
   */
  private var _policyPlugin : IPolicyPlugin
  private var _claimContactPlugin :  IClaimContactPlugin
  private var _notesPlugin : IClaimNotePlugin
  private var _documentPlugin : IClaimDocumentPlugin
  private var _fnolContactPlugin : IFnolContactPlugin
  private var _addressPlugin : IClaimAddressPlugin
  private var _lobPlugin : ILobFnolPlugin < FnolLobDTO, FnolLobDTO >
  private var _mapper : Mapper as readonly Mapper


  @ForAllGwNodes
  @Param("policyPlugin", "Plugin used to convert claim policy")
  @Param("claimContactPlugin", "Plugin used for claim contact conversion")
  @Param("contactPlugin", "Plugin used for basic contact conversion")
  @Param("notesPlugin", "Plugin used for claim notes")
  @Param("documentPlugin", "Plugin used to access claim documents")
  @Param("fnolContactPlugin", "Plugin used to work with fnol contacts")
  @Param("addressPlugin", "Plugin used to access claim addresses")
  @Param("lobPlugin", "LOB extension plugin")
  construct(
      policyPlugin : IPolicyPlugin,
      claimContactPlugin : IClaimContactPlugin,
      notesPlugin : IClaimNotePlugin,
      documentPlugin : IClaimDocumentPlugin,
      fnolContactPlugin : IFnolContactPlugin,
      addressPlugin : IClaimAddressPlugin,
      lobPlugin : ILobFnolPlugin < FnolLobDTO, FnolLobDTO >,
      authzProvider : IAuthorizerProviderPlugin) {
    this._policyPlugin = policyPlugin
    this._claimContactPlugin = claimContactPlugin
    this._notesPlugin = notesPlugin
    this._documentPlugin = documentPlugin
    this._fnolContactPlugin = fnolContactPlugin
    this._addressPlugin = addressPlugin
    this._lobPlugin = lobPlugin
    this._mapper = new Mapper(authzProvider)
  }



  override function createClaim(policy : Policy, req : FnolDTO) : Claim {
    final var claim = new Claim()
    claim.LossDate = req.LossDate
    claim.generateTempClaimNumber()
    initClaim(claim, policy, req)
    return claim
  }



  override function moveToNewPolicy(claim : Claim, newPolicy : Policy, req : FnolDTO) {
    for( i in claim.Incidents ) {
      claim.removeFromIncidents(i)
    }
    for( e in claim.Exposures ) {
      claim.removeFromExposures(e)
    }
    claim.removeAllRoles();
    initClaim(claim, newPolicy, req)
  }



  override function updateClaim(claim : Claim, dto : FnolDTO) {
    applyClaimChanges(claim, dto)
    _lobPlugin.updateClaim(claim, dto.Lobs, false)
  }

  override function submitClaim(claim : Claim, dto : FnolDTO) {
    applyClaimChanges(claim, dto)
    _lobPlugin.submitClaim(claim, dto.Lobs)
  }

  private function applyClaimChanges(claim : Claim, dto : FnolDTO) {
    validatePolicy(claim.Policy, dto)

    claim.LossCause = dto.LossCause
    claim.LossDate = dto.LossDate
    claim.LossType = dto.LossType
    claim.Description = dto.Description


    claim.LossLocation = _addressPlugin.getUpdatedAddress(claim, dto.LossLocation)
    claim.maincontact = _claimContactPlugin.getUpdatedContact(claim, dto.MainContact) as Person

    _fnolContactPlugin.updateContacts(claim,
        claim.getClaimContactsByRoles({ContactRole.TC_OTHER,ContactRole.TC_WITNESS}),
        dto.RelatedContacts)
  }

  override function toDTO(claim:Claim) : FnolDTO {
    var contactRoles = {ContactRole.TC_COVEREDPARTY,ContactRole.TC_INSURED}
    final var res = new FnolDTO()
    fillBaseProperties(res, claim)
    res.Policy = _policyPlugin.toDTO(claim.Policy)
    res.LossLocation = convertLossLocation(claim.LossLocation)
    final var interestingContacts = claim.getClaimContactsByRoles({ContactRole.TC_OTHER,ContactRole.TC_WITNESS})
    res.RelatedContacts = _fnolContactPlugin.toDTO(claim, interestingContacts)
    //res.Contacts = _claimContactPlugin.toContactDTO(interestingContacts)
    res.Contacts = _claimContactPlugin.toContactDTO(populateContactArray(claim.getContacts(), contactRoles.toTypedArray()))
    res.MainContact = _claimContactPlugin.toContactDTO(claim.getClaimContactByRole(ContactRole.TC_MAINCONTACT))
    res.AdjusterNote = getAdjusterNote(claim)
    res.Documents = _documentPlugin.getClaimDocuments(claim)
    res.CanUploadDocument = perm.Document.create
    res.Lobs = _lobPlugin.toDTO(claim)
    res.PredefinedLossLocations = getPredefinedLocations(claim)
    return res
  }

  private function populateContactArray(claimContacts:ClaimContact[], acceptableRoles:ContactRole[]):ClaimContact[]{
    return claimContacts.where( \ contact -> contactHasRole(contact, acceptableRoles));
  }

  private function contactHasRole(contact : ClaimContact, acceptableRoles:ContactRole[]) : Boolean {
    return contact.Roles.hasMatch( \ role -> acceptableRoles.contains(role.Role))
  }

  private function getPredefinedLocations(claim: Claim) : AddressDTO[] {
    return claim.Addresses.map(\address -> _addressPlugin.toDTO(claim, address))
  }

  protected function getAdjusterNote(claim : Claim) : NoteDTO {
    return Mapper.mapArray(claim.Notes,\ n -> _notesPlugin.toDTO(n)).first()
  }


  /**
   * Converts loss location into the DTO.
   */
  protected function convertLossLocation(location : Address) : AddressDTO {
    return Mapper.mapRef(location,\ l -> {
      final var res = new AddressDTO()
      DefaultAddressPlugin.fillAddress(res, location)
      return res
    })
  }

  /**
   * Fills/updates claim with the new policy.
   */
  protected function initClaim(claim:Claim,policy:Policy,claimDto:FnolDTO) {
    validatePolicy(policy, claimDto)

    claim.LossDate = claimDto.LossDate
    claim.LossType = claimDto.LossType
    claim.LossCause = claimDto.LossCause

    if (claimDto.LossLocation != null) {
      claim.LossLocation = _addressPlugin.getUpdatedAddress(claim, claimDto.LossLocation)
    }

    claim.Policy = policy

    claim.ReportedDate = gw.api.util.DateUtil.currentDate()
    // Add How Reported as Internet, since this will always be true
    claim.HowReported = HowReportedType.TC_INTERNET
    // Assume that the reporter of the claim is the Insured. This information is
    // required on Claim creation and can be overridden later if necessary.
    claim.reporter = claim.Policy.insured
    claim.ReportedByType = PersonRelationType.TC_SELF
    claim.Description = claimDto.Description
    claim.LOBCode = claim.Policy.PolicyType.Categories.firstWhere(\ t -> t typeis LOBCode) as LOBCode
    _lobPlugin.updateClaim(claim, claimDto.Lobs, true)
    if ( claim.Policy.insured typeis Person ) {
      claim.maincontact = claim.Policy.insured
    }
  }


  /**
   * Validates policy against claim DTO.
   */
  protected function validatePolicy(policy : Policy, claimDto : FnolDTO) {
    if (claimDto.LossDate < policy.EffectiveDate || policy.ExpirationDate < claimDto.LossDate) {
      throw new IllegalArgumentException("Loss date is outside of policy bounds")
    }
  }



  /**
   * Updates base (simple) properties on the FNOL dto.
   */
  public static function fillBaseProperties(dto : FnolDTO, claim : Claim) {
    dto.ClaimNumber = claim.ClaimNumber
    dto.PublicID = claim.PublicID
    dto.LossDate = claim.LossDate
    dto.LossType = claim.LossType
    dto.LossCause = claim.LossCause
    dto.Description = claim.Description
  }

}
