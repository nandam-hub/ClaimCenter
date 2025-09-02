package edge.capabilities.claim.activity.dto

uses edge.jsonmapper.JsonProperty
uses java.util.Date
uses edge.capabilities.claim.contact.dto.ContactDTO

class ActivitySummaryDTO {
  @JsonProperty  
  var _publicId: String as PublicId
  
  @JsonProperty  
  var _dueDate : Date as DueDate

  @JsonProperty
  var _status : typekey.ActivityStatus as Status
  
  @JsonProperty
  var _priority : Priority as Priority
  
  @JsonProperty
  var _subject : String as Subject
  
  @JsonProperty 
  var _claimNumber : String as ClaimNumber
  
  @JsonProperty
  var _insured : ContactDTO as Insured
  
  @JsonProperty 
  var _assignedBy: UserDTO as AssignedBy

  @JsonProperty
  var _isClaimVisible: boolean as isClaimVisible
}
