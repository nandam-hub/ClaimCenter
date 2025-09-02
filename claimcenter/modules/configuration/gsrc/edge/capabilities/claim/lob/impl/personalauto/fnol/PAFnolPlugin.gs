package edge.capabilities.claim.lob.impl.personalauto.fnol

uses edge.PlatformSupport.Logger
uses edge.PlatformSupport.Reflection
uses edge.capabilities.claim.lob.fnol.ILobFnolPlugin
uses edge.capabilities.claim.lob.impl.commonauto.IVehicleIncidentPlugin
uses edge.capabilities.claim.lob.impl.commonauto.IVehicleIncidentSRPlugin
uses edge.capabilities.claim.lob.impl.commonauto.util.VehicleUtil
uses edge.capabilities.claim.lob.impl.personalauto.PaTypeCode
uses edge.capabilities.claim.lob.impl.commonauto.dto.RepairOptionDTO
uses edge.capabilities.claim.lob.impl.commonauto.dto.VehicleIncidentDTO
uses edge.capabilities.claim.lob.impl.personalauto.fnol.dto.PAFnolExtensionDTO
uses edge.capabilities.claim.lob.shared.incidents.util.IncidentUtil
uses edge.di.annotations.InjectableNode
uses edge.security.authorization.IAuthorizerProviderPlugin
uses edge.util.mapping.ArrayUpdater
uses edge.util.mapping.Mapper

/**
 * Personal auto extension for the fnol wizard.
 */
class PAFnolPlugin implements ILobFnolPlugin<PAFnolExtensionDTO, PAFnolExtensionDTO> {

  final private static var _logger = new Logger(Reflection.getRelativeName(PAFnolPlugin))

  private var _incidentPlugin: IVehicleIncidentPlugin

  private var _serviceRequestPlugin: IVehicleIncidentSRPlugin

  private var _mapper: Mapper as Mapper

  private var _vehicleIncidentUpdater: ArrayUpdater<Claim, VehicleIncident, VehicleIncidentDTO>as VehicleIncidentUpdater

  @InjectableNode
  @Param("incidentPlugin", "Plugin used to deal with vehiicle incidents")
  construct(incidentPlugin: IVehicleIncidentPlugin, serviceRequestPlugin: IVehicleIncidentSRPlugin, authzProvider: IAuthorizerProviderPlugin) {
    this._incidentPlugin = incidentPlugin
    this._serviceRequestPlugin = serviceRequestPlugin
    this._mapper = new Mapper(authzProvider)
    this._vehicleIncidentUpdater = new ArrayUpdater<Claim, VehicleIncident, VehicleIncidentDTO>(authzProvider) {
      :ToCreateAndAdd = \c, d -> {
        var v = new VehicleIncident()
        c.addToIncidents(v)
        return v
      },
      :ToRemove = \c, v -> c.removeFromIncidents(v),
      :ToAdd = \c, v -> c.addToIncidents(v),
      :AllowedValues = \c -> c.VehicleIncidentsOnly
    }
  }


  override function toDTO(claim: Claim): PAFnolExtensionDTO {
    if (claim.Policy.PolicyType != PaTypeCode.PersonalAuto) {
      return null
    }

    final var res = new PAFnolExtensionDTO()
    res.Vehicles = Mapper.mapArray(claim.Policy.Vehicles*.Vehicle, \v -> VehicleUtil.toDTO(claim, v))
    res.VehicleIncidents = Mapper.mapArray(claim.VehicleIncidentsOnly, \v -> _incidentPlugin.toDTO(v))
    res.FixedPropertyIncident = Mapper.mapArray(claim.FixedPropertyIncidentsOnly, \e -> IncidentUtil.toDTO(e)).first()
    res.RepairOption = getRepairOptionDTO(claim)
    return res
  }

  private function getRepairOptionDTO(claim: Claim): RepairOptionDTO {
    var availableServiceRequests = Mapper.mapArray(claim.VehicleIncidentsOnly, \v -> _serviceRequestPlugin.toDTO(v)).where(\sr -> sr != null)
    if (availableServiceRequests.length > 0) {
      var selectedRepairOption = availableServiceRequests.firstWhere(\sr -> sr.RepairOptionChoice != RepairOptionChoice_Ext.TC_NOREPAIR)
      return selectedRepairOption != null ? selectedRepairOption : new RepairOptionDTO(){ :RepairOptionChoice = RepairOptionChoice_Ext.TC_NOREPAIR }
    } else {
      return null
    }
  }

  override function updateClaim(claim: Claim, dto: PAFnolExtensionDTO, isInit : boolean) {
    applyClaimChanges(claim, dto, null)
  }

  override function submitClaim(claim: Claim, dto: PAFnolExtensionDTO) {
    applyClaimChanges(claim, dto, \i -> _serviceRequestPlugin.createServiceRequest(i, dto.RepairOption))
  }

  private function applyClaimChanges(claim: Claim, dto: PAFnolExtensionDTO, additionalIncidentUpdate : block(incident : VehicleIncident)) {
    if (claim.Policy.PolicyType != PaTypeCode.PersonalAuto) {
      return
    }

    var repairableVehicle = dto.RepairOption.VehicleIncident.Vehicle
    var repairableVehicleId = repairableVehicle.PublicID != null ? repairableVehicle.PublicID : repairableVehicle.TempID
    var isRepairRequested = dto.RepairOption.RepairOptionChoice != RepairOptionChoice_Ext.TC_NOREPAIR

    IncidentUtil.updateSingleFixedPropertyIncident(claim, dto.FixedPropertyIncident);

    if (claim.VehicleIncidentsOnly.countWhere(\vi -> vi.RepairOption !== null) > 1) {
      _logger.logWarn("RepairOption can be attached to only one incident at the same time.")
    }
    var repairOption = claim.VehicleIncidentsOnly.firstWhere(\vi -> vi.RepairOption !== null).RepairOption

    VehicleIncidentUpdater.updateArray(
        claim,
        claim.VehicleIncidentsOnly,
        dto.VehicleIncidents,
        \vi, d -> {
          _incidentPlugin.updateIncident(vi, d)

          if (dto.RepairOption != null) {
            var incidentVehicleId = d.Vehicle.PublicID != null ? d.Vehicle.PublicID : d.Vehicle.TempID
            var isVehicleRepairable = repairableVehicleId == incidentVehicleId

            if (isVehicleRepairable || !isRepairRequested) {
              _serviceRequestPlugin.updateRepairOption(vi, dto.RepairOption, repairOption)
              if (additionalIncidentUpdate != null) {
                additionalIncidentUpdate(vi)
              }
            } else {
                vi.RepairOption = null
            }
          }
        }
    )
  }
}
