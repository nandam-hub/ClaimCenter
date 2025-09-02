package edge.capabilities.claim.lob.impl.general.fnol

uses edge.capabilities.claim.lob.fnol.ILobFnolPlugin
uses edge.capabilities.claim.lob.shared.incidents.IInjuryIncidentPlugin
uses edge.capabilities.claim.lob.impl.general.fnol.dto.GeneralFnolExtensionDTO
uses edge.capabilities.claim.lob.shared.incidents.dto.InjuryIncidentDTO
uses edge.capabilities.claim.lob.shared.incidents.util.IncidentUtil
uses edge.security.authorization.IAuthorizerProviderPlugin
uses edge.util.mapping.ArrayUpdater
uses edge.util.mapping.Mapper

/**
 * General claim type extension for the fnol wizard. This extension is used for various commercial policy types
 */
abstract class GeneralFnolPlugin implements ILobFnolPlugin <GeneralFnolExtensionDTO, GeneralFnolExtensionDTO> {

  private var _incidentPlugin : IInjuryIncidentPlugin
  private var _mapper : Mapper as Mapper
  private var _injuryIncidentUpdater : ArrayUpdater<Claim, InjuryIncident, InjuryIncidentDTO> as InjuryIncidentUpdater

  construct(incidentPlugin : IInjuryIncidentPlugin, authzProvider:IAuthorizerProviderPlugin) {
    this._incidentPlugin = incidentPlugin
    this._mapper = new Mapper(authzProvider)

    this._injuryIncidentUpdater = new ArrayUpdater<Claim, InjuryIncident, InjuryIncidentDTO>(authzProvider){
        : EntityKey = \ i -> i.PublicID,
        : ToCreateAndAdd = \ c, d -> {
          var incident = new InjuryIncident()
          c.addToIncidents(incident)
          return incident
        },
        : ToRemove = \ c, i -> c.removeFromIncidents(i)
    }
  }

  abstract function isPolicyTypeSupprted(type: PolicyType) : boolean

  override function toDTO(claim : Claim) : GeneralFnolExtensionDTO {
    if (!isPolicyTypeSupprted(claim.Policy.PolicyType)) {
      return null
    }

    final var res = new GeneralFnolExtensionDTO()
    res.FixedPropertyIncident = Mapper.mapArray(claim.FixedPropertyIncidentsOnly,\ e -> IncidentUtil.toDTO(e)).first()
    res.InjuryIncidents = Mapper.mapArray(claim.InjuryIncidentsOnly, \e -> _incidentPlugin.toDTO(e))
    return res
  }

  override function updateClaim(claim : Claim, dto : GeneralFnolExtensionDTO, isInit : boolean) {
    if (!isPolicyTypeSupprted(claim.Policy.PolicyType)) {
      return
    }

    IncidentUtil.updateSingleFixedPropertyIncident(claim, dto.FixedPropertyIncident);

    InjuryIncidentUpdater.updateArray(
        claim,
        claim.InjuryIncidentsOnly,
        dto.InjuryIncidents, \vi, d -> _incidentPlugin.updateIncident(vi, d)
    )

    var accountHolder = claim.Policy.PolicyAccount.AccountHolder
    if (claim.maincontact == null && accountHolder typeis Person) {
      claim.maincontact = accountHolder
    }
  }
}
