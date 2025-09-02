package edge.servlet.jsonrpc.Observability

uses gw.logging.TraceabilityIDConstants
uses org.slf4j.event.Level

interface IEdgeObservabilityConstants extends TraceabilityIDConstants {
  public static final var X_B3_PARENT_SPAN_ID : String = "X-B3-ParentSpanId"
  public static final var X_B3_SPAN_ID : String = "X-B3-SpanId"
  public static final var X_B3_TRACE_ID : String = "X-B3-TraceId"
  public static final var X_B3_SAMPLED : String = "X-B3-Sampled"
  public static final var PARENT_ID : String = "parentId"
  public static final var SPAN_EXPORTABLE : String = "spanExportable"
  public static final var SPAN_ID : String = "spanId"
  public static final var TRACE_ID : String = "traceId"
  public static final var LOG_DATETIME_FORMAT : String = "yyyy-MM-dd'T'HH:mm:ss.mmm"
  public static final var LOG_TIMESTAMP: String = "timestamp"
  public static final var LOG_METHOD: String = "jsonRpcMethod"
  public static final var LOG_ENDPOINT: String = "jsonRpcEndpoint"
  public static final var LOG_MARKER_NAME: String = "name"
  public static final var LOG_MARKER_PORTAL_REQUEST : String = "PORTAL_REQUEST"
  public static final var LOG_THREAD : String = "thread"
  public static final var LOG_THREAD_ID : String = "threadId"
  public static final var LOG_THREAD_PRIORITY : String = "threadPriority"
  public static final var LOG_TRACEABILITY_RESULT : String = "result"
  public static final var B3_HEADERS : Set<String> = {X_B3_PARENT_SPAN_ID, X_B3_SPAN_ID, X_B3_TRACE_ID, X_B3_SAMPLED, PARENT_ID, SPAN_EXPORTABLE, SPAN_ID, TRACE_ID}
  public static final var LOGGING_PROPERTY_LEVEL : String = "Observability.Logging.Level"
  public static final var LOGGING_DEFAULT_LEVEL : Level = Level.DEBUG
}
