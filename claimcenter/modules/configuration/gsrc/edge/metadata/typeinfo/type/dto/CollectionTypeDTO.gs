package edge.metadata.typeinfo.type.dto

uses edge.jsonmapper.JsonProperty
/**
 * Definition of the collection type. There is no difference between collections of different "kinds". I.e. there is no
 * difference between array, list and set.
 */
class CollectionTypeDTO extends TypeDTO {
  /** Type of one element in the collection. */
  @JsonProperty
  private var _elementType : TypeDTO as ElementType

  construct(eltType : TypeDTO) {
    super("collection")
    this._elementType = eltType
  }
}
