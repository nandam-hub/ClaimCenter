package edge.capabilities.claim.lob.impl.personalauto.fnol.dto

uses edge.capabilities.claim.lob.impl.commonauto.dto.RepairOptionDTO
uses edge.capabilities.claim.lob.impl.commonauto.dto.VehicleDTO
uses edge.jsonmapper.JsonProperty
uses edge.aspects.validation.annotations.Required
uses edge.aspects.validation.Validation
uses edge.el.Expr
uses edge.capabilities.claim.lob.shared.incidents.dto.FixedPropertyIncidentDTO
uses edge.capabilities.claim.lob.impl.commonauto.dto.VehicleIncidentDTO
uses edge.capabilities.claim.lob.fnol.dto.IFnolLobExtensionDTO

/**
 * PA LOB extension for a fnol plugin.
 */
class PAFnolExtensionDTO implements IFnolLobExtensionDTO{
  @JsonProperty
  var _fixedPropertyIncident : FixedPropertyIncidentDTO as FixedPropertyIncident

  @JsonProperty  // Not in PAFnolLobUpdateExtensionDTO
  var _vehicles : VehicleDTO[] as Vehicles

  @JsonProperty
  var _vehicleIncidents : VehicleIncidentDTO[] as VehicleIncidents

  @JsonProperty
  @Required(Expr.any({
      Expr.eq(Validation.getContext("RepairChoiceValidation"), true),
      Expr.eq(Validation.getContext("RepairFacilityValidation"), true)
  }))
  var _repairOption: RepairOptionDTO as RepairOption
}
