package edge.capabilities.claim.lob.impl.commercialauto.fnol.policy

uses edge.capabilities.claim.fnol.dto.FnolDTO
uses edge.capabilities.claim.lob.fnol.policy.ILobPolicySummaryPlugin
uses edge.capabilities.claim.lob.impl.commercialauto.fnol.policy.dto.CAPolicySummaryExtensionDTO
uses edge.capabilities.claim.lob.impl.commonauto.dto.VehicleDTO
uses edge.capabilities.claim.lob.impl.commonauto.util.VehicleUtil
uses edge.di.annotations.InjectableNode
uses edge.security.authorization.IAuthorizerProviderPlugin
uses edge.util.mapping.Mapper

class CAPolicySummaryPlugin implements ILobPolicySummaryPlugin<CAPolicySummaryExtensionDTO> {

  private var _mapper: Mapper as Mapper

  @InjectableNode
  construct(authzProvider: IAuthorizerProviderPlugin) {
    this._mapper = new Mapper(authzProvider)
  }

  override function toDTO(policySummary: PolicySummary): CAPolicySummaryExtensionDTO {
    if (policySummary.PolicyType != PolicyType.TC_BUSINESSAUTO) {
      return null
    }

    var res = new CAPolicySummaryExtensionDTO()
    res.Vehicles = Mapper
        .mapArray(policySummary.Vehicles, \v -> vehicleToDTO(v))
        .orderBy(\ru -> ru.PolicySystemId).toTypedArray()

    return res
  }

  protected function vehicleToDTO(v: PolicySummaryVehicle): VehicleDTO {
    var res = new VehicleDTO()
    VehicleUtil.fillPolicySummaryBaseProperties(res, v)
    return res
  }

  override function selectPolicySummaryRiskUnits(policySummary: PolicySummary, fnolDto: FnolDTO) {
    if (policySummary.PolicyType != PolicyType.TC_BUSINESSAUTO) {
      return
    }

    var vehicles = fnolDto.Policy.Lobs.CommercialAuto.Vehicles?.map(\ru -> {return ru.PolicySystemId})

    if (vehicles != null && vehicles.HasElements && policySummary.Vehicles.HasElements) {
      policySummary.Vehicles.each(\p -> {
        if (vehicles.hasMatch(\aVehicle -> aVehicle == p.PolicySystemId)) {
          p.Selected = true
        }
      })
    }
  }

  override function haveRiskUnitsChanged(policy: Policy, fnolDto: FnolDTO): boolean {
    if (policy.PolicyType != PolicyType.TC_BUSINESSAUTO) {
      return false
    }

    var vehicles = fnolDto.Policy.Lobs.CommercialAuto.Vehicles?.map(\ru -> ru.PolicySystemId)

    //Check if added or removed riskunits
    if (policy.Vehicles?.Count != vehicles?.length) {
      return true
    } else {
      //numbers match, check if ids match as well
      return vehicles?.hasMatch(\ru -> policy.Vehicles.firstWhere(\pr -> ru == pr.PolicySystemId) == null)
    }
  }
}
