package edge.servlet.jsonrpc.marshalling

uses java.lang.ThreadLocal
uses com.fasterxml.jackson.databind.util.ISO8601DateFormat

final class Formats {

  /** Thread-safe wrapper for the thread-unsafe date. */
  public static final var DATE_FORMAT: ThreadLocal<ISO8601DateFormat> = new ThreadLocal<ISO8601DateFormat>(){
    override protected function initialValue() : ISO8601DateFormat {
      return new ISO8601DateFormat();
    }
  }

  /** Converts gosu property name into a json property name. */
  public static function toJsonPropertyName(s : String ) : String {
    return s.substring(0, 1).toLowerCase() + s.substring(1, s.length)
  }
}
