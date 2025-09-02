package edge.capabilities.claim.lob.impl.workerscomp.claimdetail.dto

uses edge.capabilities.claim.lob.claimdetail.dto.IClaimDetailLobExtensionDTO
uses edge.jsonmapper.JsonProperty
uses java.util.Date

class WCClaimDetailExtensionDTO implements IClaimDetailLobExtensionDTO{
  @JsonProperty
  var _dateReportedToEmployer : Date as DateReportedToEmployer

  @JsonProperty
  var _incidentReport : Boolean as IncidentReport
}
