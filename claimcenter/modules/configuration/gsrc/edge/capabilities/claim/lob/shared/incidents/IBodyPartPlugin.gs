package edge.capabilities.claim.lob.shared.incidents

uses edge.capabilities.claim.lob.shared.incidents.dto.BodyPartDTO

/**
 * Plugin to work with body parts.
 */
interface IBodyPartPlugin {
  public function toDTO(bodyPart : BodyPartDetails) : BodyPartDTO
  public function updateBodyPart(bodyPart : BodyPartDetails, dto : BodyPartDTO)
}
