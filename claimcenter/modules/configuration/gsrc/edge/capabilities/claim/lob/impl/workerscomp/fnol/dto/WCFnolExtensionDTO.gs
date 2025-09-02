package edge.capabilities.claim.lob.impl.workerscomp.fnol.dto

uses edge.aspects.validation.annotations.Augment
uses edge.aspects.validation.annotations.PastDate
uses edge.aspects.validation.annotations.Required
uses edge.capabilities.claim.contact.dto.ContactDTO
uses edge.capabilities.claim.lob.fnol.dto.IFnolLobExtensionDTO
uses edge.capabilities.claim.lob.impl.workerscomp.fnol.annotations.RequiredOnSubmitAndInjuryDetailsStep
uses edge.capabilities.claim.lob.shared.incidents.dto.InjuryIncidentDTO
uses edge.jsonmapper.JsonProperty
uses java.util.Date

/**
 * LOB extension for a wc fnol plugin.
 */
class WCFnolExtensionDTO implements IFnolLobExtensionDTO{

  @JsonProperty
  @Augment({"DetailedInjuryType"}, {new RequiredOnSubmitAndInjuryDetailsStep()})
  var _injuryIncident : InjuryIncidentDTO as InjuryIncident

  @JsonProperty
  @Required
  @PastDate
  var _dateReportedToEmployer : Date as DateReportedToEmployer

  @JsonProperty
  var _incidentReport : Boolean as IncidentReport

  @JsonProperty
  var _deathReport : Boolean as DeathReport

  @JsonProperty
  @RequiredOnSubmitAndInjuryDetailsStep()
  var _timeLossReport : Boolean as TimeLossReport

  @JsonProperty
  var _employmentInjury : Boolean as EmploymentInjury

  @JsonProperty
  @RequiredOnSubmitAndInjuryDetailsStep()
  var _medicalReport : Boolean as MedicalReport

  @JsonProperty
  var _examinationDate : Date as ExaminationDate

  @JsonProperty
  var _firstIntakeDoctor : ContactDTO as FirstIntakeDoctor
}
