package edge.capabilities.claim.lob.policy.dto

uses java.util.Map
uses java.util.HashMap

/**
 * Extension for policy. Used to provide additional LOB-specific information to users.
 */
class PolicyLobDTO {

  protected var lobExtensions : Map<typekey.PolicyType, IPolicyLobExtensionDTO> = new HashMap<typekey.PolicyType, IPolicyLobExtensionDTO>()
}
