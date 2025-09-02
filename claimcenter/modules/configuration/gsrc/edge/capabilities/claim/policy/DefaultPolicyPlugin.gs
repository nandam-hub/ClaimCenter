package edge.capabilities.claim.policy
uses edge.di.annotations.ForAllGwNodes
uses edge.capabilities.claim.lob.policy.ILobPolicyPlugin
uses edge.capabilities.claim.lob.policy.dto.PolicyLobDTO
uses edge.security.authorization.IAuthorizerProviderPlugin
uses edge.util.mapping.Mapper
uses edge.capabilities.claim.policy.dto.PolicyDTO

/**
 * Default implementation of policy plugin.
 */
class DefaultPolicyPlugin implements IPolicyPlugin {
  
  /**
   * Line-of-business extension plugin.
   */
  private var _lobPlugin : ILobPolicyPlugin < PolicyLobDTO >
  
  
  /**
   * Plugin used for coverage conversion.
   */
  private var _coveragePlugin : ICoveragePlugin
  
  private var _mapper : Mapper as Mapper

  @ForAllGwNodes
  @Param("lobPlugin", "Line of business extension plugin")
  @Param("coveragePlugin", "Plugin used for coverage conversion")
  @Param("policyAuthorizer", "Plugin to check policy access")
  construct(lobPlugin : ILobPolicyPlugin < PolicyLobDTO >, coveragePlugin : ICoveragePlugin, authzProvider:IAuthorizerProviderPlugin) {
    this._lobPlugin = lobPlugin
    this._coveragePlugin = coveragePlugin
    this._mapper = new Mapper(authzProvider)
  }



  override function toDTO(policy : Policy) : PolicyDTO {
    return Mapper.mapRef(policy,\ p -> {
      final var res = new PolicyDTO()
      fillBaseProperties(res, policy)
      res.Coverages = Mapper.mapArray(policy.Coverages,\ c -> _coveragePlugin.toDTO(c))
      res.Lobs = _lobPlugin.toDTO(policy)
      return res
    })
  }
  
  
  
  /**
   * Fills base propeties on the policy.
   */
  public static function fillBaseProperties(dto : PolicyDTO, policy : Policy) {
    dto.PublicID = policy.PublicID
    dto.PolicyNumber = policy.PolicyNumber
    dto.AccountNumber = policy.AccountNumber
    dto.ExpirationDate = policy.ExpirationDate
    dto.PolicyType = policy.PolicyType.Code
    dto.EffectiveDate = policy.EffectiveDate
    dto.Status = policy.Status.DisplayName
  }
}
