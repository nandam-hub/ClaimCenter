package edge.capabilities.claim.lob.impl.commercialauto.claimdetail

uses edge.capabilities.claim.lob.claimdetail.ILobClaimDetailPlugin
uses edge.capabilities.claim.lob.impl.commercialauto.claimdetail.dto.CAClaimDetailExtensionDTO
uses edge.capabilities.claim.lob.impl.commercialauto.claimdetail.dto.CAClaimExposureExtensionDTO
uses edge.capabilities.claim.lob.impl.commonauto.IVehicleIncidentPlugin
uses edge.capabilities.claim.lob.impl.commonauto.dto.VehicleDTO
uses edge.capabilities.claim.lob.impl.commonauto.util.VehicleUtil
uses edge.di.annotations.InjectableNode

class CAClaimDetailPlugin implements ILobClaimDetailPlugin <CAClaimDetailExtensionDTO, CAClaimExposureExtensionDTO> {
  
  private var _vehicleIncidentPlugin : IVehicleIncidentPlugin
  
  @InjectableNode
  @Param("vehicleIncidentPlugin", "Plugin used to deal with vehicle incidents")
  construct(vehicleIncidentPlugin : IVehicleIncidentPlugin) {
    this._vehicleIncidentPlugin = vehicleIncidentPlugin
  }

  override function toDTO(claim : Claim) : CAClaimDetailExtensionDTO {
    if (claim.Policy.PolicyType != PolicyType.TC_BUSINESSAUTO) {
      return null
    }
    
    final var res = new CAClaimDetailExtensionDTO()
    res.Vehicles = claim.Vehicles.map(\ v -> vehicleToDTO(claim, v))
    res.VehicleIncidents = claim.VehicleIncidentsOnly.map(\i -> _vehicleIncidentPlugin.toDTO(i))
    return res
  }
  
  

  override function exposureToDTO(exposure : Exposure) : CAClaimExposureExtensionDTO {
    if (exposure.VehicleIncident == null) {
      return null
    }
    
    final var res = new CAClaimExposureExtensionDTO()
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
