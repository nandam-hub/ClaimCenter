package edge.capabilities.note.dto

uses edge.jsonmapper.JsonProperty

uses java.util.Date
uses edge.aspects.validation.annotations.Required
uses edge.aspects.validation.annotations.Size

class NoteDTO {
  
  @JsonProperty
  var _publicId : String as PublicID

  @JsonProperty @Size(0, 255) @Required
  var _subject: String as Subject
  
  @JsonProperty @Size(0, 65000) @Required
  var _body: String as Body

  @JsonProperty  // @ReadOnly
  var _confidential: Boolean as Confidential
  
  @JsonProperty  // @ReadOnly
  var _dateCreated: Date as DateCreated  
  
  @JsonProperty  // @ReadOnly
  var _author: NoteAuthorDTO as Author

  @JsonProperty  // @ReadOnly
  var _topic: NoteTopicType as Topic

}
