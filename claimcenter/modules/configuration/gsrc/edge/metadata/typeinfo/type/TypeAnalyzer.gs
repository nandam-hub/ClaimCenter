package edge.metadata.typeinfo.type

uses java.util.Set
uses edge.metadata.typeinfo.type.dto.PrimitiveTypeDTO
uses edge.metadata.typeinfo.type.dto.CollectionTypeDTO
uses edge.metadata.typeinfo.type.dto.StringMapTypeDTO
uses java.lang.IllegalArgumentException
uses edge.metadata.typeinfo.type.dto.ClassTypeDTO
uses gw.lang.reflect.IType
uses gw.util.Pair
uses edge.metadata.typeinfo.type.dto.TypeDTO
uses java.util.Map
uses edge.PlatformSupport.Reflection

uses gw.api.util.Logger


/**
 * Analyzer for types.
 */
final class TypeAnalyzer {
  private static var LOGGER = Logger.forCategory(TypeAnalyzer.Type.QName)

  /** Collection types supported by this DTO analyzer. */
  private static final var COLLECTION_TYPES : Set<String> = {
      "java.util.LinkedList",
      "java.util.ArrayList",
      "java.util.List",
      "java.util.Set",
      "java.util.HashSet",
      "java.util.TreeSet"
  }


  /** Map types supported by this DTO analyzer. */
  private static final var MAP_TYPES : Set<String> = {
      "java.util.Map",
      "java.util.HashMap",
      "java.util.TreeMap"
  }


  /** Semi-primitives, which are treated as real primitives by the portal. */
  private static final var SEMI_PRIMITIVES : Map<IType, String> = {
    java.lang.Byte -> "Byte",
    java.lang.Short -> "Short",
    java.lang.Character -> "Char",
    java.lang.Integer -> "Integer",
    java.lang.Long -> "Long",
    java.lang.Float -> "Float",
    java.lang.Double -> "Double",
    java.lang.Boolean -> "Boolean",
    java.lang.String -> "String",

    java.util.Date -> "Date",
    java.math.BigDecimal -> "BigDecimal",
    java.math.BigInteger -> "BigInteger"
  }


  /** Encodes "type name" into the DTO representation of this type.
   * Following types are supported:
   * <ul>
   *   <li>Primitive types and wrappers for those primitive types.
   *   <li>Arrays of any types (which could be encoded).
   *   <li>Collection types: LinkedList/ArrayList/List/Set/HashSet/TreeSet types whith type parameters
   *     (but only these types, their subtupes are not supported). Other implementations of collections are not
   *     supported.
   *   <li>Map types: Map/HashMap/TreeMap types with type parameters (keys must be Strings). Other implementation of
   *     map types are not supported.
   *   <li>All other non-collection non-map types are encoded as simple references to those type names. Types must not
   *     be a generic types.
   * </ul>
   * @throws IllegalArgumentException if type is not supported (and could not be encoded). This includes:
   *   <ul>
   *     <li>Collection types which are not one of the specific subset of types.
   *     <li>Map types outside of the specific range (or with non-string arguments).
   *     <li>Generic types (i.e. types having generic arguments at this instantiations and not being collections or
   *       maps).
   *   </ul>
   */
  public static function encodeType(tp : IType) : Pair<TypeDTO, IType[]> {
    if (tp.Primitive) {
      return new Pair<TypeDTO, IType[]>(new PrimitiveTypeDTO(tp.Name), {})
    }

    final var semiPrimitiveName = SEMI_PRIMITIVES.get(tp)
    if (semiPrimitiveName != null) {
      return new Pair<TypeDTO, IType[]>(new PrimitiveTypeDTO(semiPrimitiveName), {})
    }

    if (tp.Array) {
      final var compResult = encodeType(tp.ComponentType)
      return new Pair<TypeDTO, IType[]>(
          new CollectionTypeDTO(compResult.First), compResult.Second)
    }

    if (isCollection(tp)) {
      final var collResult = encodeType(tp.TypeParameters[0])
      return new Pair<TypeDTO, IType[]>(
          new CollectionTypeDTO(collResult.First), collResult.Second)
    }

    if (isMap(tp)) {
      final var mpResult = encodeType(tp.TypeParameters[1])
      return new Pair<TypeDTO, IType[]>(
          new StringMapTypeDTO(mpResult.First), mpResult.Second)
    }

    if (tp.TypeParameters != null && tp.TypeParameters.length > 0) {
      throw new IllegalArgumentException("Could not encode generic non-collection type " + tp.Name)
    }

    return new Pair<TypeDTO, IType[]>(new ClassTypeDTO(tp.Name), {tp})
  }

  /** Checks if type should be considered a primitive one. */
  public static function isPrimitive(tp : IType) : Boolean {
    return tp.Primitive || SEMI_PRIMITIVES.containsKey(tp)
  }


  /**
   * Checks if the type is proper collection type. Type is proper when it implements a collection interface and exact
   * type is one of specific implementation types.
   * @returns <code>true</code> iff type is a "proper" collection type. <code>false</code> iff type is not a collection
   * type.
   * @throws IllegalArgumentException if <code>type</code> is a collection type but not from the list of predifined
   * (supported) collection types.
   */
  public  static function isCollection(type : IType) : boolean {
    if (!(java.util.Collection.isAssignableFrom(type))) {
      return false
    }

    final var genericType = Reflection.getGenericType(type)
    if (genericType != null && COLLECTION_TYPES.contains(genericType.Name)) {
      return true
    }

    throw new IllegalArgumentException("Type " + type.Name +
        " implements collection interface but is not one of the supported collection types.")
  }


  /**
   * Checks if the type is proper mapping type. Type is proper when it implements a map interface with string keys and
   * at the same time it is one of the specific types.
   * @returns <code>true</code> iff type is a "proper" mapping type. <code>false</code> iff type is not a mappings
   * type.
   * @throws IllegalArgumentException if <code>type</code> is a mapping type but not from the list of predifined
   * (supported) mapping types.
   */
  public static function isMap(type : IType) : boolean {
    if (!(java.util.Map.isAssignableFrom(type))) {
      return false
    }

    final var genericType = Reflection.getGenericType(type)
    if (genericType == null || !MAP_TYPES.contains(genericType.Name)) {
      throw new IllegalArgumentException("Type " + type.Name +
          " implements map interface but is not one of the supported collection types.")
    }

    if (type.TypeParameters[0] != String) {
      if (type.TypeParameters[0] != Object) {
        throw new IllegalArgumentException("Type " + type.Name +
            " implements map interface and must have a string key.")
      }
      LOGGER.error("Map with Object key was analyzed as a DTO type. This is allowed for backward compatibility but you should use string-keyed maps.")
    }

    return true
  }
}
