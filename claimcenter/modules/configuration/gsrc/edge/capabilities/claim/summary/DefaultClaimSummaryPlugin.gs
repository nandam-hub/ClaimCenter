package edge.capabilities.claim.summary
uses edge.capabilities.currency.dto.AmountDTO
uses edge.di.annotations.ForAllGwNodes
uses edge.capabilities.address.IAddressPlugin
uses edge.capabilities.claim.contact.IClaimContactPlugin
uses edge.capabilities.claim.summary.dto.ClaimSummaryDTO
uses edge.security.authorization.Authorizer

/**
 * Default implementation of claim summary plugin.
 */
class DefaultClaimSummaryPlugin implements IClaimSummaryPlugin {
  
  /**
   * Plugin to convert addresses.
   */
  private var _addressPlugin : IAddressPlugin
  
  /**
   * Plugin used to deal with claim contacts.
   */
  private var _claimContactPlugin : IClaimContactPlugin

  /**
   * Plugin used to determine claim rpt access rules
   */
  private var _claimRptAuthorizer : Authorizer<ClaimRpt>

  @ForAllGwNodes
  @Param("addressPlugin", "Address conversion plugin")
  @Param("claimContactPlugin", "Plugin used to deal with claim contacts")
  @Param("claimRptAuthorizer", "Plugin used to determine claim rpt access rules")
  construct(addressPlugin : IAddressPlugin, claimContactPlugin : IClaimContactPlugin, claimRptAuthorizer : Authorizer<ClaimRpt>) {
    this._addressPlugin = addressPlugin
    this._claimContactPlugin = claimContactPlugin
    this._claimRptAuthorizer = claimRptAuthorizer
  }


  override function getSummary(claim : Claim) : ClaimSummaryDTO {
    final var res = new ClaimSummaryDTO()
    res.Addresses = claim.Addresses.map(\ a -> _addressPlugin.toDto(a))
    res.InsuredContact = _claimContactPlugin.toContactDTO(claim.Policy.getClaimContactByRole(ContactRole.TC_INSURED))
    res.Vendors = _claimContactPlugin.toDTO(claim.ClaimContactsForAllRoles)
    fillBaseProperties(res, claim)

    if (_claimRptAuthorizer.canAccess(claim.ClaimRpt)) {
      res.TotalIncurredNet = AmountDTO.fromCurrencyAmount(claim.ClaimRpt.TotalIncurredNet)
      res.TotalPayments = AmountDTO.fromCurrencyAmount(claim.ClaimRpt.TotalPayments)
    }

    return res
  }


  /**
   * Fills base (raw) properties on the claim summary dto.
   */
  public static function fillBaseProperties(dto: ClaimSummaryDTO, claim : Claim) {
    dto.ClaimNumber = claim.ClaimNumber
    dto.PublicID = claim.PublicID
    dto.LossDate = claim.LossDate
    dto.LossType = claim.LossType
    dto.Description = claim.Description    
    dto.ClaimState = claim.State
    dto.PolicyNumber = claim.Policy.PolicyNumber
    if(claim.LOBCode!=null){
      dto.LineOfBusinessCode = claim.LOBCode.Code
    }else{
      dto.LineOfBusinessCode = claim.Policy.PolicyType.Code
    }
  }
}
