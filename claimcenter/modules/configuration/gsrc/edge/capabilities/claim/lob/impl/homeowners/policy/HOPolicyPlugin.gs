package edge.capabilities.claim.lob.impl.homeowners.policy
uses edge.capabilities.claim.lob.policy.ILobPolicyPlugin
uses edge.capabilities.address.IAddressPlugin
uses edge.capabilities.claim.policy.ICoveragePlugin
uses edge.util.mapping.Mapper
uses edge.security.authorization.IAuthorizerProviderPlugin
uses edge.capabilities.claim.lob.impl.homeowners.policy.dto.HOPolicyExtensionDTO
uses edge.capabilities.claim.lob.impl.homeowners.policy.dto.PolicyLocationDTO
uses edge.di.annotations.InjectableNode

/**
 * Homeowner LOB policy extension plugin.
 */
class HOPolicyPlugin implements ILobPolicyPlugin <HOPolicyExtensionDTO> {

  private var _addressPlugin : IAddressPlugin
  private var _coveragePlugin : ICoveragePlugin
  private var _mapper : Mapper as readonly Mapper

  @InjectableNode
  @Param("addressPlugin", "Address conversion plugin")
  @Param("coveragePlugin", "Coverage support plugin")
  construct(addressPlugin : IAddressPlugin, coveragePlugin : ICoveragePlugin, authzProvider:IAuthorizerProviderPlugin) {
    this._addressPlugin = addressPlugin
    this._coveragePlugin = coveragePlugin
    this._mapper = new Mapper(authzProvider)
  }


  override function toDTO(policy : Policy) : HOPolicyExtensionDTO {
    if (policy.PolicyType != PolicyType.TC_HOPHOMEOWNERS) {
      return null
    }
    final var res = new HOPolicyExtensionDTO()
    res.Locations = Mapper.mapArray(policy.PolicyLocations,\ p -> locationToDTO(p))
    return res
  }



  protected function locationToDTO(location : PolicyLocation) : PolicyLocationDTO {
    final var dto = new PolicyLocationDTO()

    dto.PublicID = location.PublicID
    dto.LocationNumber = location.LocationNumber
    dto.LocationDescription = location.Address.Description
    dto.LocationAddress = Mapper.mapRef(location.Address, \ a -> _addressPlugin.toDto(a))
    dto.HasListedItems = location.HighValueItems.Count > 0
    dto.Coverages = Mapper.mapArray(location.LocationBasedRisks*.Coverages,\ r -> _coveragePlugin.toDTO(r))
    return dto
  }
}
