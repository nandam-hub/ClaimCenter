package edge.capabilities.claim.lob.claimdetail.dto

uses java.util.Map
uses java.util.HashMap

/**
 * Lob-specific extension for the exposure.
 */
class ClaimExposureLobDTO {
  protected var lobExtensions : Map<typekey.PolicyType, IClaimExposureLobExtensionDTO> = new HashMap<typekey.PolicyType, IClaimExposureLobExtensionDTO>()

}
