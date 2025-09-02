package edge.metadata.typeinfo.dto

uses edge.jsonmapper.JsonProperty

/**
 * DTO which holds object representation along with its type.
 */
class TypedDTO {
  /** Type of an actual object. */
  @JsonProperty
  private var _type : String as Type

  /** Value of the serialized object (its internal representation). */
  @JsonProperty
  private var _value : Object as Value

  /** Creates a new typed DTO assigning run-time value type to the type tag and object itself to the dto value. */
  public static function create(value : Object) : TypedDTO {
    final var res = new TypedDTO()
    res._type = (typeof value).Name
    res._value = value
    return res
  }
}
