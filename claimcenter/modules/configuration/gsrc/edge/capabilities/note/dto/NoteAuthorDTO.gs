package edge.capabilities.note.dto

uses edge.jsonmapper.JsonProperty


/**
 * Information about note author.
 */
class NoteAuthorDTO {
  @JsonProperty    
  var _firstName: String as FirstName

  @JsonProperty
  var _lastName: String as LastName
}
