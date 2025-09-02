package edge.di
/**
 * Status of the handler lookup.
 */
final class HandlerStatus {
  private var _docHandlers : int as readonly DocumentHandlerCount
  private var _jsonRpcHandlers : int as readonly JsonRpcHandlerCount

  construct(dh : int, jrpch : int) {
    this ._docHandlers = dh
    this._jsonRpcHandlers = jrpch
  }
}
