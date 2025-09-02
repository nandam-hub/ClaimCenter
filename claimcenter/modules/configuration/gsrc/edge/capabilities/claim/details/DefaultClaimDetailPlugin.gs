package edge.capabilities.claim.details
uses edge.capabilities.claim.checks.IClaimCheckPlugin
uses edge.capabilities.currency.dto.AmountDTO
uses edge.capabilities.servicerequest.local.IServiceRequestPlugin
uses edge.di.annotations.ForAllGwNodes
uses edge.capabilities.address.IAddressPlugin
uses edge.capabilities.claim.policy.IPolicyPlugin
uses edge.capabilities.claim.contact.IClaimContactPlugin
uses edge.capabilities.claim.contact.util.ClaimContactUtil
uses edge.capabilities.claim.lob.claimdetail.ILobClaimDetailPlugin
uses edge.capabilities.claim.lob.claimdetail.dto.ClaimDetailLobDTO
uses edge.capabilities.claim.lob.claimdetail.dto.ClaimExposureLobDTO
uses edge.capabilities.claim.notes.IClaimNotePlugin
uses edge.capabilities.claim.document.IClaimDocumentPlugin
uses edge.capabilities.claim.details.dto.ClaimDTO
uses edge.capabilities.claim.details.dto.ClaimReporterDTO
uses edge.capabilities.claim.details.dto.ExposureDTO
uses edge.capabilities.claim.details.dto.UserDTO
uses edge.security.authorization.Authorizer

class DefaultClaimDetailPlugin implements IClaimDetailPlugin {
  
  /**
   * Plugin used to convert addresses.
   */
  private var _addressPlugin : IAddressPlugin
  private var _policyPlugin : IPolicyPlugin
  private var _claimContactPlugin :  IClaimContactPlugin
  private var _notesPlugin : IClaimNotePlugin
  private var _lobPlugin : ILobClaimDetailPlugin < ClaimDetailLobDTO, ClaimExposureLobDTO >
  private var _documentPlugin : IClaimDocumentPlugin
  private var _checksPlugin : IClaimCheckPlugin
  private var _serviceRequestPlugin : IServiceRequestPlugin
  private var _claimRptAuthorizer : Authorizer<ClaimRpt>



  @ForAllGwNodes
  @Param("addressPlugin", "Plugin used for adderss conversion")
  @Param("policyPlugin", "Plugin used to convert claim policy")
  @Param("claimContactPlugin", "Plugin used for claim contact conversion")
  @Param("notesPlugin", "Plugin used for claim notes")
  @Param("lobPlugin", "LOB extension plugin")
  @Param("documentPlugin", "Plugin used to access claim documents")
  @Param("checksPlugin", "Plugin used to access claim checks")
  @Param("claimRptAuthorizer", "Plugin used to determine claim rpt access rules")
  construct(addressPlugin : IAddressPlugin,
      policyPlugin : IPolicyPlugin,
      claimContactPlugin : IClaimContactPlugin, 
      notesPlugin : IClaimNotePlugin,
      lobPlugin : ILobClaimDetailPlugin < ClaimDetailLobDTO, ClaimExposureLobDTO >,
      documentPlugin : IClaimDocumentPlugin,
      checksPlugin : IClaimCheckPlugin,
      serviceRequestPlugin: IServiceRequestPlugin,
      claimRptAuthorizer : Authorizer<ClaimRpt>) {


    this._addressPlugin = addressPlugin
    this._policyPlugin = policyPlugin
    this._claimContactPlugin = claimContactPlugin
    this._notesPlugin = notesPlugin
    this._lobPlugin = lobPlugin
    this._documentPlugin = documentPlugin
    this._checksPlugin = checksPlugin
    this._serviceRequestPlugin = serviceRequestPlugin
    this._claimRptAuthorizer = claimRptAuthorizer
  }



  override function toDTO(claim:Claim) : ClaimDTO {
    final var res = new ClaimDTO()
    fillBaseProperties(res, claim)
    
    res.Addresses = claim.Addresses.map(\a -> _addressPlugin.toDto(a))
    res.LossLocation = _addressPlugin.toDto(claim.LossLocation)
    res.Policy = _policyPlugin.toDTO(claim.Policy)
    
    res.ClaimContacts = _claimContactPlugin.toDTO(claim.Contacts)
    res.RelatedContacts = _claimContactPlugin.toContactDTO(claim.Contacts)
    res.MainContact = _claimContactPlugin.toContactDTO(claim.getClaimContactByRole(ContactRole.TC_MAINCONTACT))
    res.Vendors = _claimContactPlugin.toDTO(
      claim.ClaimContactsForAllRoles.where(\cc -> ClaimContactUtil.isVendor(cc)))
    res.ClaimReporter = new ClaimReporterDTO(){
      :RelationToInsured = claim.ReportedByType,
      :ReportedBy = _claimContactPlugin.toContactDTO(claim.getClaimContactByRole(ContactRole.TC_REPORTER))
    }
    res.Adjuster = convertAdjuster(claim.AssignedUser)
    
    res.Exposures = claim.Exposures.map(\ e -> convertExposure(e))
    res.Lobs = _lobPlugin.toDTO(claim)
    res.Notes = _notesPlugin.getNotes(claim)
    res.Documents = _documentPlugin.getClaimDocuments(claim)
    res.CanUploadDocument = perm.Document.create
    res.Checks = _checksPlugin.getChecksDTO(claim)
    res.ServiceRequests = _serviceRequestPlugin.getServiceRequests(claim)

    if (_claimRptAuthorizer.canAccess(claim.ClaimRpt)) {
      res.TotalIncurredNet = AmountDTO.fromCurrencyAmount(claim.ClaimRpt.TotalIncurredNet)
      res.TotalPayments = AmountDTO.fromCurrencyAmount(claim.ClaimRpt.TotalPayments)
    }

    return res
  }
  
  
  
  protected function convertExposure(e : Exposure) :  ExposureDTO {
    final var res = new ExposureDTO()
    fillBaseProperties(res, e)
    res.Lobs = _lobPlugin.exposureToDTO(e)
    return res
  }
  
  
  
  protected function convertAdjuster(user : User) : UserDTO {
    final var res = new UserDTO()
    fillBaseProperties(res, user)
    return res
  }
  
  
  /**
   * Fills base (primitive) properties on the user DTO.
   */
  public static function fillBaseProperties(dto : UserDTO, user : User) {
    dto.DisplayName = user.DisplayName
    dto.FirstName = user.Contact.FirstName
    dto.LastName = user.Contact.LastName
    dto.PhoneNumber = user.Contact.WorkPhone
    dto.Email = user.Contact.EmailAddress1
  }


  /**
   * Fills base (primitive) properties on the user DTO.
   */
  public static function fillBaseProperties(dto : ExposureDTO, exposure : Exposure) {
    dto.PublicID = dto.PublicID
    dto.CoverageType = exposure.PrimaryCoverage
    dto.ExposureState = exposure.State
  }

  /**
   * Fills base (primitive) properties on the claim DTO.
   */
  public static function fillBaseProperties(dto : ClaimDTO, claim : Claim) {
    dto.ClaimNumber = claim.ClaimNumber
    dto.PublicID = claim.PublicID
    dto.LossDate = claim.LossDate
    dto.LossType = claim.LossType
    dto.LossCause = claim.LossCause
    dto.Description = claim.Description
    dto.ClaimState = claim.State as java.lang.String 
  }
}
