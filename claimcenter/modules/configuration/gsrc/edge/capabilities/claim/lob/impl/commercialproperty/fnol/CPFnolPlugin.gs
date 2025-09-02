package edge.capabilities.claim.lob.impl.commercialproperty.fnol

uses edge.capabilities.claim.lob.fnol.ILobFnolPlugin
uses edge.capabilities.claim.lob.impl.commercialproperty.fnol.dto.CPFixedPropertyIncidentDTO
uses edge.capabilities.claim.lob.impl.commercialproperty.fnol.dto.CPFnolExtensionDTO
uses edge.di.annotations.InjectableNode
uses edge.security.authorization.IAuthorizerProviderPlugin
uses edge.util.mapping.ArrayUpdater

class CPFnolPlugin implements ILobFnolPlugin<CPFnolExtensionDTO, CPFnolExtensionDTO> {

  private var _fixedPropertyIncidentUpdater : ArrayUpdater<Claim, FixedPropertyIncident, CPFixedPropertyIncidentDTO> as FixedPropertyIncidentUpdater

  @InjectableNode
  construct(authzProvider: IAuthorizerProviderPlugin) {
    this._fixedPropertyIncidentUpdater =
        new ArrayUpdater<Claim, FixedPropertyIncident, CPFixedPropertyIncidentDTO>(authzProvider){
            :EntityKey = \incident -> incident.PublicID,
            :ToCreateAndAdd = \claim, dto -> {
              var incident = new FixedPropertyIncident()
              claim.addToIncidents(incident)
              return incident
            },
            :ToRemove = \claim, incident -> claim.removeFromIncidents(incident)
        }
  }

  override function toDTO(claim: Claim): CPFnolExtensionDTO {
    if (claim.Policy.PolicyType != PolicyType.TC_COMMERCIALPROPERTY) {
      return null
    }

    var res = new CPFnolExtensionDTO()
    res.FixedPropertyIncidents = claim.FixedPropertyIncidentsOnly
        .map(\incident -> CPFixedPropertyIncidentDTO.fromFixedPropertyIncident(incident))
    res.DateOfNotice = claim.ReportedDate
    res.IncidentReport = claim.IncidentReport

    return res
  }

  override function updateClaim(claim: Claim, dto: CPFnolExtensionDTO, isInit : boolean) {
    if (claim.Policy.PolicyType != PolicyType.TC_COMMERCIALPROPERTY) {
      return
    }

    // Set public ids to null if initialising claim, can happen when RU's have changed
    if (isInit) {
      for (incident in dto.FixedPropertyIncidents) {
        incident.PublicID = null;
      }
    }

    // Filter out incidents with non-existing locations
    var incidents = dto.FixedPropertyIncidents == null ? null : dto.FixedPropertyIncidents
        .where(\incident -> claim.Policy.PolicyLocations.hasMatch(\location -> location.LocationNumber == incident.Location))

    FixedPropertyIncidentUpdater.updateArray(
        claim,
        claim.FixedPropertyIncidentsOnly,
        incidents,
        \incident, fixedPropertyIncidentDto -> fixedPropertyIncidentDto.updateFixedPropertyIncident(claim, incident))

    claim.ReportedDate = dto.DateOfNotice
    claim.IncidentReport = dto.IncidentReport
  }

  override function submitClaim(claim: Claim, dto: CPFnolExtensionDTO) {
    updateClaim(claim, dto, false)
  }
}
