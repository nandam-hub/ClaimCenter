package edge.capabilities.claim.lob.impl.personalauto.claimdetail

uses edge.capabilities.claim.lob.claimdetail.ILobClaimDetailPlugin
uses edge.capabilities.claim.lob.impl.commonauto.IVehicleIncidentPlugin
uses edge.capabilities.claim.lob.impl.commonauto.dto.VehicleDTO
uses edge.capabilities.claim.lob.impl.commonauto.util.VehicleUtil
uses edge.capabilities.claim.lob.impl.personalauto.PaTypeCode
uses edge.capabilities.claim.lob.impl.personalauto.claimdetail.dto.PAClaimDetailExtensionDTO
uses edge.capabilities.claim.lob.impl.personalauto.claimdetail.dto.PAClaimExposureExtensionDTO
uses edge.di.annotations.InjectableNode

class PAClaimDetailPlugin implements ILobClaimDetailPlugin <PAClaimDetailExtensionDTO, PAClaimExposureExtensionDTO> {
  
  private var _vehicleIncidentPlugin : IVehicleIncidentPlugin
  
  @InjectableNode
  @Param("vehicleIncidentPlugin", "Plugin used to deal with vehicle incidents")
  construct(vehicleIncidentPlugin : IVehicleIncidentPlugin) {
    this._vehicleIncidentPlugin = vehicleIncidentPlugin
  }

  override function toDTO(claim : Claim) : PAClaimDetailExtensionDTO {
    if (claim.Policy.PolicyType != PaTypeCode.PersonalAuto) {
      return null
    }
    
    final var res = new PAClaimDetailExtensionDTO()
    res.Vehicles = claim.Vehicles.map(\ v -> vehicleToDTO(claim, v))
    res.VehicleIncidents = claim.VehicleIncidentsOnly.map(\i -> _vehicleIncidentPlugin.toDTO(i))
    return res
  }
  
  

  override function exposureToDTO(exposure : Exposure) : PAClaimExposureExtensionDTO {
    if (exposure.VehicleIncident == null) {
      return null
    }
    
    final var res = new PAClaimExposureExtensionDTO()
    res.VehicleIncident = _vehicleIncidentPlugin.toDTO(exposure.VehicleIncident)
    return res
  }



  protected function vehicleToDTO(claim : Claim, v : Vehicle) : VehicleDTO {
    final var res = new VehicleDTO()
    VehicleUtil.fillBaseProperties(res, v)
    res.PolicyVehicle = VehicleUtil.isPolicyVehicle(claim, v)
    return res
  }
}
