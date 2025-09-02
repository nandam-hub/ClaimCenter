package edge.capabilities.claim.fnol.dto

uses edge.jsonmapper.JsonProperty
uses edge.capabilities.claim.policy.dto.PolicyDTO
uses java.util.Date
uses edge.capabilities.claim.contact.dto.ContactDTO
uses edge.capabilities.claim.lob.fnol.dto.FnolLobDTO
uses edge.capabilities.note.dto.NoteDTO
uses edge.capabilities.claim.document.dto.ClaimDocumentDTO
uses edge.el.Expr
uses edge.aspects.validation.annotations.Size
uses edge.aspects.validation.annotations.Pattern
uses edge.aspects.validation.annotations.Required
uses edge.capabilities.claim.fnol.metadata.validation.annotations.PastLossDate
uses edge.aspects.validation.annotations.PhoneNumberPresent
uses edge.aspects.validation.Validation
uses edge.aspects.validation.annotations.FilterByCategory
uses edge.capabilities.address.dto.AddressDTO
uses edge.jsonmapper.JsonReadOnlyProperty
uses java.lang.Boolean

/**
 * DTO with "First notice of loss" information.
 */
class FnolDTO {
  /**
   * The public identifier for this claim within ClaimCenter
   */
  @JsonProperty
  @Size(0, 50) // @ReadOnly
  var _publicId : String as PublicID

  /**
   * A unique identifier for this claim
   */
  @JsonProperty
  @Required(Expr.neq(Expr.getProperty("PublicID", Validation.PARENT), null))
  @Size(0, 40)
  @Pattern("(CP-[0-9]{4})?([0-9]{3}-[0-9]{2}-[0-9]{6})?")
  var _claimNumber : String as ClaimNumber

  /**
   * Details for the policy the claim relates to
   */
  @JsonProperty
  var _policy : PolicyDTO as Policy

  /**
   * The reported date that the loss occurred
   */
  @JsonProperty
  @Required
  @PastLossDate
  var _lossDate : Date as LossDate

  /**
   * The type of loss (e.g. AUTO for Personal Auto)
   */
  @JsonProperty @Required
  var _lossType : typekey.LossType as LossType

  /**
   * The cause of the loss (e.g. vehcollision for a vehicle collision)
   */
  @JsonProperty @Required @FilterByCategory("LossType")
  var _lossCause : typekey.LossCause as LossCause

  /**
   * Reported description of the loss
   */
  @JsonProperty @Size(0, 1333)
  var _description : String as Description

  /**
   * The main contact for the loss
   */
  @JsonProperty
  @PhoneNumberPresent(Expr.eq(Validation.getContext("SubmittingClaim"), true))
  var _mainContact : ContactDTO as MainContact

  /**
   * Contacts relating to the loss
   */
  @JsonReadOnlyProperty
  var _contacts : ContactDTO[] as Contacts

  /**
   * Reported address where the loss occurred
   */
  @JsonProperty
  var _lossLocation : AddressDTO as LossLocation

  /**
   * Related contacts including FNOL specific details for each contact
   */
  @JsonProperty
  var _relatedContacts : FnolRelatedContactDTO[] as RelatedContacts

  /**
   * Line of business specific details relating to the loss
   */
  @JsonProperty
  var _lobs : FnolLobDTO as Lobs

  /**
   * A note on the claim specifically for the adjuster
   * <strong>This collection is not saved on server when claim is saved.</strong>
   */
  @JsonReadOnlyProperty
  var _adjusterNote : NoteDTO as AdjusterNote

  /**
   * Any documents relating to the claim
   * <strong>This collection is not saved on server when claim is saved.</strong>
   */
  @JsonReadOnlyProperty
  var _documents : ClaimDocumentDTO[] as Documents

  @JsonProperty
  var _canUploadDocument : Boolean as CanUploadDocument

  @JsonReadOnlyProperty
  var _predefinedLossLocations : AddressDTO[] as PredefinedLossLocations
}
