package edge.metadata.service

uses gw.util.Pair

/**
 * Interface used to access metadata of a single element.
 */
interface IElementMetadata {
  /** Returns all metadata (both named and unnamed)) of the type T. */
  public reified function getMetadata<T>() : List<T>

  /** Returns named metadata of the given type .*/
  public reified function getNamedMetadata<T>(name : String) : List<T>

  /** Returns unnamed metadata of the type T. */
  public reified function getUnnamedMetadata<T>() : List<T>


  /** Returns all unnamed metadata on the element. */
  public function getAllUnnamedMetadata() : List<Object>

  /** Returns all named metadata on the property. */
  public function getAllNamedMetadata() : List<Pair<String, Object>>
}
