package edge.capabilities.claim.lob.policy
uses edge.capabilities.claim.lob.policy.dto.PolicyLobDTO
uses java.util.Map
uses edge.di.boot.Bootstrap
uses edge.di.CapabilityAndPath
uses edge.di.Path
uses edge.di.annotations.ForAllGwNodes

/**
 * Composite line-of-business extension plugin.
 */
final class CompositeLobPolicyPlugin implements ILobPolicyPlugin < PolicyLobDTO > {

  private var _lobMap : Map<String, ILobPolicyPlugin >

  @ForAllGwNodes
  construct() {
    //Using Bootstrap as a service locator until DI framework evolves to support injecting a map of dependencies
    _lobMap = Bootstrap.forceCreateMap< ILobPolicyPlugin >(new CapabilityAndPath("claim", Path.parse("policy.lob")))
  }

  override function toDTO(policy : Policy) : PolicyLobDTO {
    final var res = new PolicyLobDTO ()
    for (entry in _lobMap.entrySet()) {
      res[entry.Key] = entry.Value.toDTO(policy)
    }
    return res
  }

}
