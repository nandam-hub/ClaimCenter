package edge.util
uses java.util.Map
uses java.lang.Iterable
uses java.util.HashMap
uses java.util.ArrayList
uses java.lang.IllegalArgumentException
uses java.util.Arrays

/** Map utilities. Cannot make map enhancements to work on Carbon. */
final class MapUtil {

  static function getOrDefault<K, V>(map : Map<K, V>, key : K, deflt : V) : V {
    return map.containsKey(key) ? map.get(key) : deflt
  }

  static function getOrUpdate<K, V>(map : Map<K, V>, key : K, dflt() : V) : V {
    if (map.containsKey(key)) {
      return map.get(key)
    }

    final var res = dflt()
    map.put(key, res)
    return res
  }

  /**
   * Groups iterable items by its keys and map that keys to list of extracted values.
   */
  static function groupCollection<I, K, V>(items : Iterable<I>, key(i : I) : K, value(i : I) : V) : Map<K, List<V>> {
    final var result = new HashMap<K, List<V>>()

    for (var item in items) {
      getOrUpdate(result, key(item), \ -> new ArrayList<V>()).add(value(item))
    }

    return result
  }


  static function groupUnique<I, K, V>(items : Iterable<I>, key(i : I) : K, value(i : I) : V) : Map<K, V> {
    final var result = new HashMap<K, V>()

    for (var item in items) {
      final var k = key(item)
      if (result.containsKey(k)) {
        throw new IllegalArgumentException("Duplicate key " + k + " found")
      }
      result.put(k, value(item))
    }

    return result
  }

  static function groupUniqueBy<I, K>(items : Iterable<I>, key(i : I) : K) : Map<K, I> {
    return groupUnique(items , key, \ i -> i)
  }



  static function groupUniqueArray<I, K, V>(items : I[], key(i : I) : K, value(i : I) : V) : Map<K, V> {
    return groupUnique<I, K, V>(Arrays.asList(items), key, value)
  }


  static function groupUniqueArrayBy<I, K>(items : I[], key(i : I) : K) : Map<K, I> {
    return groupUnique<I, K, I>(Arrays.asList(items), key, \i -> i)
  }


  /**
   * Ensures that key is present in the map and returs value for that key.
   */
  static function forceGet<K, V>(map : Map<K, V>, key : K) : V {
    final var res = map.get(key)
    if (res == null && !map.containsKey(key)) {
      throw new IllegalArgumentException("Could not find value for the key " + key)
    }
    return res
  }
}
