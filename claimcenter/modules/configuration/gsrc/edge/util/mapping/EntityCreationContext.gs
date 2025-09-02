package edge.util.mapping

uses java.util.HashMap
uses java.lang.IllegalArgumentException
uses java.lang.IllegalStateException

/**
 * Context used to track creation of new entities. 
 * This context tracks mapping from temporary ids to 
 * entities. Each temporary ID should be unique.
 */
final class EntityCreationContext {
  /**
   * Created entities.
   */
  private var items = new HashMap<String, Object>()

  public function add(key : String, item : Object) {
    if (key == null) {
      throw new IllegalArgumentException("Bad item key")
    }
    
    if (item == null) {
      throw new IllegalArgumentException("Null values are not allowed for the map")
    }
    
    if (items.put(key, item) != null) {
      throw new IllegalArgumentException("Attempt to overwrite item was detected for id " + key)
    }
  }
  
  /**
   * Returns a registered object for the given key. Returns <code>null</code> if object
   * was not found.
   */
  public reified function forKey<T>(key : String) : T {
    final var item = items.get(key)
    if (item == null) {
      return null
    }
    
    if (!(item typeis T)) {
      throw new IllegalStateException("Cannot get item for key " + key + " as " + T + ", actual type is " + typeof(item))
    }
    
    return item as T
  }
  
  /**
   * Creates a new entity using a given factory.
   */
  public function create<T>(id : String , factory() : T) : T {
    if (id == null) {
      throw new IllegalArgumentException("Bad item key")
    }
    
    if (items.containsKey(id)) {
      throw new IllegalStateException("Item with key " + id + " is already registered in the context")
    }
    
    final var res = factory()
    return res
  }

  /**
   * Returns a registered key for the given Object. Returns <code>null</code> if key
   * was not found.
   */
  public function forItem<T>(item: T) : String {
    return items.entrySet().firstWhere(\entry -> entry.Value == item).Key
  }
}
