package edge.capabilities.claim.lob.shared.incidents.util

uses java.lang.UnsupportedOperationException
uses edge.capabilities.claim.lob.shared.incidents.dto.FixedPropertyIncidentDTO

final class IncidentUtil {

  private construct() {
    throw new UnsupportedOperationException()
  }

  static function updateSingleFixedPropertyIncident(claim : Claim, dto : FixedPropertyIncidentDTO) {
    var claimFixedPropertyIncident = claim.FixedPropertyIncidentsOnly.first()

    if (dto == null || dto.PropertyDescription == null) {
      if (claimFixedPropertyIncident != null) {
        claim.removeFromIncidents(claimFixedPropertyIncident)
      }
    } else {
      if (claimFixedPropertyIncident == null) {
        claimFixedPropertyIncident = new FixedPropertyIncident()
        claimFixedPropertyIncident.Property.Address = claim.LossLocation
        claim.addToIncidents(claimFixedPropertyIncident)
      }
      IncidentUtil.updateBaseProperties(claimFixedPropertyIncident, dto)
    }
  }

  static function toDTO(incident : FixedPropertyIncident) : FixedPropertyIncidentDTO {
    if (incident == null) {
      return null
    }
    final var res = new FixedPropertyIncidentDTO()
    res.PublicID = incident.PublicID       
    res.Description = incident.Description
    res.PropertyDescription = incident.PropertyDesc        
    return res
  }

  static function updateBaseProperties(incident : FixedPropertyIncident, dto : FixedPropertyIncidentDTO) {
    incident.Description = dto.Description
    incident.PropertyDesc = dto.PropertyDescription
  }
}
