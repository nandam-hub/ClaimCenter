package edge.capabilities.claim.lob.claimdetail.dto

uses java.util.HashMap
uses java.util.Map

/**
 * Lob extension for the claim details.
 */
class ClaimDetailLobDTO {

  protected var lobExtensions : Map<typekey.PolicyType, IClaimDetailLobExtensionDTO> = new HashMap<typekey.PolicyType, IClaimDetailLobExtensionDTO>()

}
