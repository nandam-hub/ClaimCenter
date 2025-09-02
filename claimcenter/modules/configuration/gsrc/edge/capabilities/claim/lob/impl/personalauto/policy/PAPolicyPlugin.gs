package edge.capabilities.claim.lob.impl.personalauto.policy
uses edge.capabilities.claim.lob.impl.commonauto.dto.VehicleDTO
uses edge.capabilities.claim.lob.impl.commonauto.util.VehicleUtil
uses edge.capabilities.claim.lob.policy.ILobPolicyPlugin
uses edge.capabilities.claim.policy.ICoveragePlugin
uses edge.util.mapping.Mapper
uses edge.security.authorization.IAuthorizerProviderPlugin
uses edge.capabilities.claim.lob.impl.personalauto.PaTypeCode
uses edge.capabilities.claim.lob.impl.personalauto.policy.dto.PAPolicyExtensionDTO
uses edge.di.annotations.InjectableNode

/**
 * Personal auto policy extension plugin.
 */
class PAPolicyPlugin implements ILobPolicyPlugin <PAPolicyExtensionDTO> {
  
  /**
   * Policy coverage plugin.
   */
  private var _coveragePlugin : ICoveragePlugin

  private var _mapper : Mapper as Mapper
  
  @InjectableNode
  @Param("coveragePlugin", "Plugin used to deal with policy coverages")
  construct(coveragePlugin : ICoveragePlugin, authzProvider:IAuthorizerProviderPlugin) {
    this._coveragePlugin = coveragePlugin
    this._mapper = new Mapper(authzProvider)
  }


  override function toDTO(policy : Policy) : PAPolicyExtensionDTO {
    if (policy.PolicyType != PaTypeCode.PersonalAuto) {
      return null
    }
    final var res = new PAPolicyExtensionDTO()
    res.Vehicles = Mapper.mapArray(policy.Vehicles,\ v -> vehicleToDTO(v))
    return res
  }
  
  
  /**
   * Converts policy vehicle into DTO.
   */
  protected function vehicleToDTO(v : VehicleRU) : VehicleDTO {
    final var res = new VehicleDTO()
    VehicleUtil.fillBaseProperties(res, v.Vehicle)
    res.PolicyVehicle = true
    res.Coverages = Mapper.mapArray(v.Coverages,\ r -> _coveragePlugin.toDTO(r))
    return res
  }

}
