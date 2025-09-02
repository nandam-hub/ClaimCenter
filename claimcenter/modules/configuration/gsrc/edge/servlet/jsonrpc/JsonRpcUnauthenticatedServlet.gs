package edge.servlet.jsonrpc

uses jakarta.servlet.http.HttpServletResponse
uses jakarta.servlet.http.HttpServletRequest
uses gw.servlet.Servlet

@Servlet(\ path : String -> path.matches("/unauthenticated/edge/(.*)")) // /edge/document is used for retrieving documents
class JsonRpcUnauthenticatedServlet extends JsonRpcServlet {

  public static final var UNAUTHENTICATED_USER : String = "unauthenticated-user"
  public static final var HANDLER_LOOKUP_REQ_PATH : String = "unauthenticated-user"
  
  override protected function service(req : HttpServletRequest, resp : HttpServletResponse) {
    req.setAttribute(UNAUTHENTICATED_USER, true)
    req.setAttribute(HANDLER_LOOKUP_REQ_PATH, req.PathInfo.remove("/unauthenticated"))
    super.service( req, resp )
  }
}