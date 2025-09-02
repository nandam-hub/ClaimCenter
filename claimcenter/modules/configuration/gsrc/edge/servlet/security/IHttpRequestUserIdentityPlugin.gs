package edge.servlet.security

uses edge.security.EffectiveUser
uses jakarta.servlet.http.HttpServletRequest

/**
 * Interface responsible for retrieving authentication and authorization information from the
 * incoming HTTP request
 */
interface IHttpRequestUserIdentityPlugin {
  /**
  * Retrieve username and granted authorities information from the request to create an effective user instance
  **/
  function getEffectiveUserFromRequest(req : HttpServletRequest) : EffectiveUser
}