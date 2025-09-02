package edge.capabilities.claim.lob.impl.commercialauto.fnol

uses edge.PlatformSupport.Logger
uses edge.PlatformSupport.Reflection
uses edge.capabilities.claim.lob.fnol.ILobFnolPlugin
uses edge.capabilities.claim.lob.impl.commercialauto.fnol.dto.CAFnolExtensionDTO
uses edge.capabilities.claim.lob.impl.commonauto.IVehicleIncidentPlugin
uses edge.capabilities.claim.lob.impl.commonauto.IVehicleIncidentSRPlugin
uses edge.capabilities.claim.lob.impl.commonauto.dto.VehicleIncidentDTO
uses edge.capabilities.claim.lob.impl.commonauto.util.VehicleUtil
uses edge.capabilities.claim.lob.shared.incidents.util.IncidentUtil
uses edge.di.annotations.InjectableNode
uses edge.security.authorization.IAuthorizerProviderPlugin
uses edge.util.mapping.ArrayUpdater
uses edge.util.mapping.Mapper

/**
 * Personal auto extension for the fnol wizard.
 */
class CAFnolPlugin implements ILobFnolPlugin<CAFnolExtensionDTO, CAFnolExtensionDTO> {

  final private static var _logger = new Logger(Reflection.getRelativeName(CAFnolPlugin))

  private var _incidentPlugin: IVehicleIncidentPlugin

  private var _mapper: Mapper as Mapper

  private var _vehicleIncidentUpdater: ArrayUpdater<Claim, VehicleIncident, VehicleIncidentDTO>as VehicleIncidentUpdater

  @InjectableNode
  @Param("incidentPlugin", "Plugin used to deal with vehiicle incidents")
  construct(incidentPlugin: IVehicleIncidentPlugin, serviceRequestPlugin: IVehicleIncidentSRPlugin, authzProvider: IAuthorizerProviderPlugin) {
    this._incidentPlugin = incidentPlugin
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


  override function toDTO(claim: Claim): CAFnolExtensionDTO {
    if (claim.Policy.PolicyType != PolicyType.TC_BUSINESSAUTO) {
      return null
    }

    final var res = new CAFnolExtensionDTO()
    res.Vehicles = Mapper.mapArray(claim.Policy.Vehicles*.Vehicle, \v -> VehicleUtil.toDTO(claim, v))
    res.VehicleIncidents = Mapper.mapArray(claim.VehicleIncidentsOnly, \v -> _incidentPlugin.toDTO(v))
    res.FixedPropertyIncident = Mapper.mapArray(claim.FixedPropertyIncidentsOnly, \e -> IncidentUtil.toDTO(e)).first()
    return res
  }

  override function updateClaim(claim: Claim, dto: CAFnolExtensionDTO, isInit : boolean) {
    // DefaultFnolPlugin.initClaim() sets the reporter to Policy.insured which is a company for CA,
    // but FNOLWizard_BasicInfoScreen.default.pcf expects it to be a person otherwise it fails with ClassCastException.
    // To workaround this issue we use the current user as a reporter
    if (isInit && !(claim.reporter typeis Person)) {
      claim.reporter = User.util.CurrentUser.Contact
    }

    if(isInit && claim.Policy.PolicyType == PolicyType.TC_BUSINESSAUTO){
      //We are clearing the vehicle incidents from DTO because in the scenario when Risk units get changed in the UI, DefaultFnolPlugin.moveToNewPolicy removes all incident from the claim entity
      //but the vehicle incident DTO will have reference to the public id of vehicle incident entities which are removed from claim and we end up getting an error when its tries updating
      dto.VehicleIncidents = {}
    }

    applyClaimChanges(claim, dto)
  }

  override function submitClaim(claim: Claim, dto: CAFnolExtensionDTO) {
    applyClaimChanges(claim, dto)
  }

  private function applyClaimChanges(claim: Claim, dto: CAFnolExtensionDTO) {
    if (claim.Policy.PolicyType != PolicyType.TC_BUSINESSAUTO) {
      return
    }

    IncidentUtil.updateSingleFixedPropertyIncident(claim, dto.FixedPropertyIncident);

    if (claim.VehicleIncidentsOnly.countWhere(\vi -> vi.RepairOption !== null) > 1) {
      _logger.logWarn("RepairOption can be attached to only one incident at the same time.")
    }

    VehicleIncidentUpdater.updateArray(
        claim,
        claim.VehicleIncidentsOnly,
        dto.VehicleIncidents,
        \vi, d -> {
          _incidentPlugin.updateIncident(vi, d)
        }
    )
  }
}
