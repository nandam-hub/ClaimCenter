package edge.capabilities.claim.lob.impl.commercialproperty.fnol.dto

uses edge.aspects.validation.annotations.PastDate
uses edge.aspects.validation.annotations.Required
uses edge.capabilities.claim.lob.fnol.dto.IFnolLobExtensionDTO
uses edge.jsonmapper.JsonProperty
uses java.util.Date;

class CPFnolExtensionDTO implements IFnolLobExtensionDTO {

  @JsonProperty
  @Required
  @PastDate
  var _dateOfNotice : Date as DateOfNotice

  @JsonProperty
  var _incidentReport : Boolean as IncidentReport

  @JsonProperty
  var _fixedPropertyIncidents : CPFixedPropertyIncidentDTO[] as FixedPropertyIncidents
}
