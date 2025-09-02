package edge.capabilities.claim.activity.dto

uses edge.jsonmapper.JsonProperty
uses edge.capabilities.claim.contact.dto.ContactDTO
uses java.util.Date
uses edge.aspects.validation.annotations.Size
uses edge.aspects.validation.annotations.Required

class ActivityDTO {
  @JsonProperty 
  var _publicID : String as PublicID

  @JsonProperty  @Size(0, 1333)
  var _description : String as Description
  
  @JsonProperty  @Required
  var _claimNumber : String as ClaimNumber
  
  @JsonProperty @Required
  var _status : typekey.ActivityStatus as Status
  
  @JsonProperty
  var _insured : ContactDTO as Insured
  
  @JsonProperty  @Required
  var _priority : Priority as Priority
  
  @JsonProperty 
  var _recurring : boolean as Recurring
  
  @JsonProperty 
  var _mandatory : boolean as Mandatory
  
  @JsonProperty 
  var _assignedBy: UserDTO as AssignedBy
    
  @JsonProperty  
  var _dueDate : Date as DueDate
  
  @JsonProperty  
  var _completedDate : Date as CompletedDate
  
  @JsonProperty 
  var _escalationDate : Date as EscalationDate
  
  @JsonProperty  @Size(1, 255)
  var _subject : String as Subject
  
  @JsonProperty 
  var _importance : typekey.ImportanceLevel as Importance
}
