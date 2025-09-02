package edge.capabilities.claim.lob.shared.incidents

uses edge.capabilities.claim.lob.shared.incidents.dto.BodyPartDTO
uses edge.di.annotations.ForAllGwNodes

class DefaultBodyPartPlugin implements IBodyPartPlugin {

  @ForAllGwNodes
  construct() {
  }

  override function toDTO(bodyPart: BodyPartDetails): BodyPartDTO {
    var dto = new BodyPartDTO()

    dto.PrimaryBodyPart = bodyPart.PrimaryBodyPart
    dto.DetailedBodyPart = bodyPart.DetailedBodyPart
    dto.ImpairmentPercentage = bodyPart.ImpairmentPercentage
    dto.DetailedBodyPartDesc = bodyPart.DetailedBodyPartDesc
    dto.SideOfBody = bodyPart.SideOfBody

    return dto
  }

  public function updateBodyPart(bodyPart: BodyPartDetails, dto: BodyPartDTO) {
    bodyPart.PrimaryBodyPart = dto.PrimaryBodyPart
    bodyPart.DetailedBodyPart = dto.DetailedBodyPart
    bodyPart.ImpairmentPercentage = dto.ImpairmentPercentage
    bodyPart.DetailedBodyPartDesc = dto.DetailedBodyPartDesc
    bodyPart.SideOfBody = dto.SideOfBody
  }
}
