package edge.metadata.typeinfo.util

uses edge.metadata.typeinfo.dto.TypedDTO
uses edge.metadata.typeinfo.util.dto.NamedMetadataDTO
uses gw.util.Pair

/**
 * Metadata utilities.
 */
class MetadataUtil {
  /** Converts named metadata list to DTO. */
  public static function unnamedToDto(metadata : List<Object>) : TypedDTO[] {
    return metadata.map( \ elt -> TypedDTO.create(elt)).toTypedArray()
  }

  /** Converts named metadata list to DTO. */
  public static function namedToDto(metadata : List<Pair<String, Object>>) : NamedMetadataDTO[] {
    return metadata
        .map( \ elt -> new NamedMetadataDTO(elt.First, TypedDTO.create(elt.Second)))
        .toTypedArray()
  }
}
