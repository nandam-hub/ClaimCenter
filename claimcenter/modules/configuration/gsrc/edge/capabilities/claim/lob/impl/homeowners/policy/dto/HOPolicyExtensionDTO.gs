package edge.capabilities.claim.lob.impl.homeowners.policy.dto

uses edge.capabilities.claim.lob.policy.dto.IPolicyLobExtensionDTO
uses edge.jsonmapper.JsonProperty

/**
 * Homeowners policy information extension.
 */
class HOPolicyExtensionDTO implements IPolicyLobExtensionDTO {
  /**
   * Homeowner locations.
   */
  @JsonProperty
  var _locations : PolicyLocationDTO[] as Locations
}
