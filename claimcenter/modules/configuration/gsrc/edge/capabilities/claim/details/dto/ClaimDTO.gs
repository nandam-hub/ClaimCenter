package edge.capabilities.claim.details.dto

uses edge.capabilities.claim.checks.dto.CheckDTO
uses edge.capabilities.servicerequest.dto.ServiceRequestDTO
uses edge.jsonmapper.JsonProperty
uses java.util.Date
uses edge.capabilities.address.dto.AddressDTO
uses edge.capabilities.claim.policy.dto.PolicyDTO
uses edge.capabilities.claim.contact.dto.ContactDTO
uses edge.capabilities.claim.contact.dto.ClaimContactDTO
uses edge.capabilities.claim.lob.claimdetail.dto.ClaimDetailLobDTO
uses edge.capabilities.note.dto.NoteDTO
uses edge.capabilities.claim.document.dto.ClaimDocumentDTO
uses edge.capabilities.currency.dto.AmountDTO
uses java.lang.Boolean

class ClaimDTO {

  /**
   * The number to identify this claim
   */
  @JsonProperty
  var _claimNumber : String as ClaimNumber

  /**
   * The claims public id
   */
  @JsonProperty
  var _publicID : String as PublicID

  /**
   * The date that loss occurred
   */
  @JsonProperty
  var _lossDate :   Date as LossDate

  /**
   * The type of loss that occured
   */
  @JsonProperty
  var _lossType : typekey.LossType as LossType

  /**
   * What caused the loss to occur
   */
  @JsonProperty
  var _lossCause : typekey.LossCause as LossCause

  /**
   * The address where the loss occured
   */
  @JsonProperty
  var _lossLocation :   AddressDTO as LossLocation

  /**
   * A description of the loss
   */
  @JsonProperty
  var _description : String as Description

  /**
   * The policy associated with the claim
   */
  @JsonProperty
  var _policy : PolicyDTO as Policy

  /**
   *  List of addresses associated with the claim
   */
  @JsonProperty
  var _addresses : AddressDTO[] as Addresses

  /**
   * The claims main contact
   */
  @JsonProperty
  var _mainContact : ContactDTO   as MainContact

  /**
   * Related contacts associated with the claim
   */
  @JsonProperty
  var _relatedContacts : ContactDTO[] as RelatedContacts

  /**
   * All contacts associated with the claim
   */
  @JsonProperty
  var _claimContacts : ClaimContactDTO[] as ClaimContacts

  /**
   * Vendors associated with the claim
   */
  @JsonProperty
  var _vendors: ClaimContactDTO[] as Vendors

  /**
   * The state of the claim
   */
  @JsonProperty
  var _claimState:String as ClaimState

  /**
   * The reporter of the claim
   */
  @JsonProperty
  var _claimReporter : ClaimReporterDTO as ClaimReporter

  /**
   * The adjusted associated with the claim
   */
  @JsonProperty
  var _adjuster:UserDTO as Adjuster

  /**
   * The exposures associated with the claim
   */
  @JsonProperty
  var _exposures:ExposureDTO[] as Exposures

  /**
   * Line-of-business extension DTO.
   */
  @JsonProperty
  var _lobs : ClaimDetailLobDTO as Lobs


  /**
   * Notes for the claim.
   * <strong>This collection is not saved on server when claim is saved.</strong>
   */
  @JsonProperty
   var _notes : NoteDTO[] as Notes

  /**
   * Documents for the claim.
   * <strong>This collection is not saved on server when claim is saved.</strong>
   */
  @JsonProperty
   var _documents : ClaimDocumentDTO[] as Documents

  @JsonProperty
  var _canUploadDocument : Boolean as CanUploadDocument

  /**
   * Checks for the claim.
   * <strong>This collection is not saved on server when claim is saved.</strong>
   */
  @JsonProperty
  var _checks : CheckDTO[] as Checks

  /**
   * Service requests associated with the claim.
   * <strong>This collection is not saved on server when claim is saved.</strong>
   */
  @JsonProperty
  var _serviceRequests : ServiceRequestDTO[] as ServiceRequests

  /**
   * Total incurred net amount
   */
  @JsonProperty
  var _totalIncurredNet: AmountDTO as TotalIncurredNet

  /**
   * Total payments amount
   */
  @JsonProperty
  var _totalPayments: AmountDTO as TotalPayments
}
