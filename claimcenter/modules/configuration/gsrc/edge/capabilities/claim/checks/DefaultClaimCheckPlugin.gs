package edge.capabilities.claim.checks

uses edge.capabilities.claim.checks.dto.CheckDTO
uses edge.capabilities.currency.dto.AmountDTO
uses edge.di.annotations.ForAllGwNodes
uses edge.security.EffectiveUserProvider
uses edge.security.authorization.AuthorityType
uses edge.security.authorization.IAuthorizerProviderPlugin
uses edge.util.mapping.Mapper

class DefaultClaimCheckPlugin implements IClaimCheckPlugin {

  private var VALID_CHECK_STATUSES = {
      TransactionStatus.TC_AWAITINGSUBMISSION,
      TransactionStatus.TC_CLEARED,
      TransactionStatus.TC_ISSUED,
      TransactionStatus.TC_REQUESTED,
      TransactionStatus.TC_REQUESTING,
      TransactionStatus.TC_TRANSFERRED
  }

  private var _mapper : Mapper as Mapper

  @ForAllGwNodes
  construct(authzProvider : IAuthorizerProviderPlugin) {
    this._mapper = new Mapper(authzProvider)
  }

  override function getChecks(claim:Claim) : Check[] {
    var relatedContact = claim.Insured
    if (claim.Policy.PolicyType == PolicyType.TC_WORKERSCOMP) {
      relatedContact = claim.getContactByRole(ContactRole.TC_CLAIMANT)
    }
    return claim.getChecksQuery().where(\check -> checkViewable(check, relatedContact)).toTypedArray()
  }

  override function getChecksDTO(claim: Claim) : CheckDTO[] {
    var checks = getChecks(claim)
    return toDTO(checks)
  }

  override function toDTO(checks: Check[]) : CheckDTO[] {
    return Mapper.mapArray(checks, \ c -> toDTO(c))
  }

  override function toDTO(check:Check) : CheckDTO {
    var checkDto = new CheckDTO()
    checkDto.CheckNumber = check.CheckNumber
    checkDto.Status = check.Status
    checkDto.ScheduledDate = check.ScheduledSendDate
    checkDto.IssueDate = check.IssueDate
    checkDto.GrossAmount = AmountDTO.fromCurrencyAmount(check.GrossAmount)

    if (check.Claim.Policy.PolicyType == PolicyType.TC_WORKERSCOMP) {
      checkDto.Payee = check.Payees
          .where(\elt -> elt.PayeeType == ContactRole.TC_CLAIMANT)
          .map(\elt -> getPayee(elt))
    } else {
      checkDto.Payee = check.Payees
          .map(\elt -> getPayee(elt))
    }

    return checkDto
  }

  private function getPayee(payee:CheckPayee) : String {
    return payee.Payee.DisplayName
  }

  private function checkViewable(check:Check, claimInsured:Contact) : Boolean {
    var isInsuredPayee = check.Payees.hasMatch(\elt1 -> elt1.ClaimContact.Contact == claimInsured)
    var validTransactionStatus = VALID_CHECK_STATUSES.contains(check.Status)
    return isInsuredPayee && validTransactionStatus
  }

}
