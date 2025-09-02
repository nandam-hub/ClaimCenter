package edge.capabilities.claim.lob.shared.incidents
uses edge.capabilities.claim.lob.shared.incidents.dto.BodyPartDTO
uses edge.capabilities.claim.lob.shared.incidents.dto.InjuryIncidentDTO
uses edge.di.annotations.ForAllGwNodes
uses edge.capabilities.claim.contact.IClaimContactPlugin
uses edge.util.mapping.ArrayUpdater
uses edge.util.mapping.Mapper
uses edge.security.authorization.IAuthorizerProviderPlugin

/**
 * Injury incident conversion plugin.
 */
class DefaultInjuryIncidentPlugin implements IInjuryIncidentPlugin {

  private var _claimContactPlugin : IClaimContactPlugin
  private var _bodyPartPlugin : IBodyPartPlugin
  private var _mapper : Mapper as Mapper
  private var _bodyPartUpdater : ArrayUpdater<InjuryIncident, BodyPartDetails, BodyPartDTO>as BodyPartUpdater

  @ForAllGwNodes
  construct(bodyPartPlugin : IBodyPartPlugin, claimContactPlugin : IClaimContactPlugin, authzProvider: IAuthorizerProviderPlugin) {
    this._bodyPartPlugin = bodyPartPlugin
    this._claimContactPlugin = claimContactPlugin
    this._mapper = new Mapper(authzProvider)
    this._bodyPartUpdater = new ArrayUpdater<InjuryIncident, BodyPartDetails, BodyPartDTO>(authzProvider){
        : ToCreateAndAdd = \ incident, bodyPart -> incident.newBodyPart(),
        : ToRemove = \ incident, bodyPart -> {
            if (incident.BodyParts.length > 1) {
              incident.removeFromBodyParts(bodyPart)
            }
          }
        }
  }

  override function toDTO(incident : InjuryIncident) : InjuryIncidentDTO {
    return Mapper.mapRef(incident,\ i -> {
      final var res = new InjuryIncidentDTO()

      fillBaseProperties(res, incident)

      res.Injured = Mapper.mapRef(
          incident.getClaimContactByRole(ContactRole.TC_INJURED),
          \ c -> _claimContactPlugin.toContactDTO(c)
      )

      res.BodyParts = Mapper.mapArray(incident.BodyParts,\ v -> _bodyPartPlugin.toDTO(v))

      return res
    })
  }

  override function updateIncident(incident : InjuryIncident, dto : InjuryIncidentDTO) {
    updateBaseProperties(incident, dto)
    incident.injured = _claimContactPlugin.getUpdatedContact(incident.Claim, dto.Injured) as Person

    BodyPartUpdater.updateArray(
        incident,
        incident.BodyParts,
        dto.BodyParts, \ bodyPart, d -> _bodyPartPlugin.updateBodyPart(bodyPart, d)
    )
  }

  public static function fillBaseProperties(dto : InjuryIncidentDTO, incident : InjuryIncident) {
    dto.PublicID = incident.PublicID
    dto.Description = incident.Description
    dto.GeneralInjuryType = incident.GeneralInjuryType
    dto.DetailedInjuryType = incident.DetailedInjuryType;
  }

  public static function updateBaseProperties(incident : InjuryIncident, dto : InjuryIncidentDTO) {
    incident.Description = dto.Description
    incident.DetailedInjuryType = dto.DetailedInjuryType
    incident.GeneralInjuryType = dto.GeneralInjuryType
  }
}
