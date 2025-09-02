package edge.metadata.typeinfo.typelistinfo.dto

uses edge.jsonmapper.JsonProperty


/**
 * Type code category. Contains a reference to the target category and the affected typelist value.
 */
class TypeCodeCategoryMetadataDTO {
  /**
   * Parent (defining) typelist.
   */
  @JsonProperty
  var _typelist : String as Typelist


  /**
   * Typecode of the parent element in the parent list.
   */
  @JsonProperty
  var _typecode : String as Typecode
}
