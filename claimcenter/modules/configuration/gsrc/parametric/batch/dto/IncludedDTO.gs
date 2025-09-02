package parametric.batch.dto

class IncludedDTO {

  private var _claimContact : ClaimContactDTO[] as ClaimContact

  construct(claimContact : ClaimContactDTO[]) {
    _claimContact = claimContact
  }
}