package edge.capabilities.claim.lob.impl.workerscomp.fnol

uses edge.capabilities.claim.contact.IContactPlugin
uses edge.capabilities.claim.lob.fnol.ILobFnolPlugin
uses edge.capabilities.claim.lob.shared.incidents.IInjuryIncidentPlugin
uses edge.capabilities.claim.lob.impl.workerscomp.fnol.dto.WCFnolExtensionDTO
uses edge.capabilities.claim.lob.shared.incidents.dto.InjuryIncidentDTO
uses edge.di.annotations.InjectableNode
uses edge.security.authorization.IAuthorizerProviderPlugin
uses edge.util.mapping.Mapper
uses edge.util.mapping.RefUpdater

/**
 * Workers compensation extension for the fnol wizard.
 */
class WCFnolPlugin implements ILobFnolPlugin<WCFnolExtensionDTO, WCFnolExtensionDTO> {

  private var _incidentPlugin : IInjuryIncidentPlugin
  private var _contactPlugin: IContactPlugin
  private var _mapper : Mapper as Mapper
  private var _injuryIncidentUpdater : RefUpdater<Claim, InjuryIncident, InjuryIncidentDTO>

  @InjectableNode
  construct(
      incidentPlugin : IInjuryIncidentPlugin,
      contactPlugin: IContactPlugin,
      authzProvider:IAuthorizerProviderPlugin
  ) {
    this._incidentPlugin = incidentPlugin
    this._contactPlugin = contactPlugin
    this._mapper = new Mapper(authzProvider)

    this._injuryIncidentUpdater = new RefUpdater<Claim, InjuryIncident, InjuryIncidentDTO>(authzProvider){
      :EntityKey = \i -> i.PublicID,
      :ToCreate = \c, d -> {
        var incident = c.ensureClaimInjuryIncident()

        if (d.BodyParts == null || d.BodyParts.IsEmpty) {
          var firstBodyPart = DefaultFirstBodyPart
          incident.addToBodyParts(firstBodyPart)
        }

        c.addToIncidents(incident)
        return incident
      },
      :AllowedValues = \ claim -> {
        return { claim.ClaimInjuryIncident }
      }
    }
  }

  override function toDTO(claim : Claim) : WCFnolExtensionDTO {
    if (!isPolicyTypeSupprted(claim.Policy.PolicyType)) {
      return null
    }

    final var res = new WCFnolExtensionDTO()
    res.DateReportedToEmployer = claim.DateRptdToEmployer
    res.IncidentReport = claim.IncidentReport
    res.DeathReport = claim.DeathReport
    res.EmploymentInjury = claim.EmploymentInjury
    res.TimeLossReport = claim.TimeLossReport
    res.MedicalReport = claim.MedicalReport
    res.ExaminationDate = claim.ExaminationDate
    res.FirstIntakeDoctor = _contactPlugin.toDTO(claim.FirstIntakeDoctor)

    res.InjuryIncident = _mapper.mapRef(claim.ClaimInjuryIncident, \d -> _incidentPlugin.toDTO(d))
    res.InjuryIncident.Injured = _contactPlugin.toDTO(claim.claimant)

    return res
  }

  override function updateClaim(claim : Claim, dto : WCFnolExtensionDTO, isInit : boolean) {
    applyClaimChanges(claim, dto)
  }

  override function submitClaim(claim: Claim, dto: WCFnolExtensionDTO) {
    applyClaimChanges(claim, dto)
  }

  private function applyClaimChanges(claim: Claim, dto: WCFnolExtensionDTO) {
    if (!isPolicyTypeSupprted(claim.Policy.PolicyType)) {
      return
    }

    claim.claimant = _contactPlugin.getUpdatedPerson(claim, dto.InjuryIncident.Injured)
    dto.InjuryIncident.Injured = null;
    _injuryIncidentUpdater.updateRef(claim, dto.InjuryIncident, \i, d -> _incidentPlugin.updateIncident(i, d))

    claim.DateRptdToEmployer = dto.DateReportedToEmployer
    claim.IncidentReport = dto.IncidentReport
    claim.DeathReport = dto.DeathReport
    claim.EmploymentInjury = dto.EmploymentInjury
    claim.TimeLossReport = dto.TimeLossReport
    claim.MedicalReport = dto.MedicalReport
    claim.ExaminationDate = dto.ExaminationDate
    claim.FirstIntakeDoctor = _contactPlugin.getUpdatedDoctor(claim, dto.FirstIntakeDoctor)
  }

  private function isPolicyTypeSupprted(type: PolicyType): boolean {
    return type == PolicyType.TC_WORKERSCOMP
  }

  private property get DefaultFirstBodyPart() : BodyPartDetails {
    var firstBodyPart = new BodyPartDetails()
    firstBodyPart.PrimaryBodyPart = typekey.BodyPartType.TC_MULTIPLE
    firstBodyPart.DetailedBodyPart = typekey.DetailedBodyPartType.TC_65
    return firstBodyPart
  }
}
