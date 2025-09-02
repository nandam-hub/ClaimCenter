package edge.servlet.jsonrpc

uses jakarta.servlet.http.HttpServletResponse
uses jakarta.servlet.http.HttpServletRequest
uses edge.security.EffectiveUser

/**
 * Handler for the bad requests.
 */
final class BadRequestHandler implements IRequestProcessor {

  /** Handler for the bad Multipart request. */
  internal final static var BAD_MULTIPART_REQUEST : IRequestProcessor =
      new BadRequestHandler("Multipart request is not expected for this URL")


  /** Message to send to the user. */
  private var _msg : String
  private construct(msg: String) {
    this._msg = msg
  }


  override function process(user: EffectiveUser, req: HttpServletRequest, resp: HttpServletResponse) {
    resp.setStatus(HttpServletResponse.SC_BAD_REQUEST)
    resp.Writer.write(_msg)
  }
}