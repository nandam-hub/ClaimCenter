package edge.capabilities.claim.lob.fnol.dto

uses edge.jsonmapper.JsonProperty
uses java.util.Map
uses java.util.HashMap

/**
 * FNOL LOB extension DTO.
 */
class FnolLobDTO {

  protected var lobExtensions : Map<typekey.PolicyType, IFnolLobExtensionDTO> = new HashMap<typekey.PolicyType, IFnolLobExtensionDTO>()
}
