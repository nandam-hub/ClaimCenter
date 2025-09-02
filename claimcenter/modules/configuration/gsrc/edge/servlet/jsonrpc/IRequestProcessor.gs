package edge.servlet.jsonrpc

uses jakarta.servlet.http.HttpServletRequest

uses edge.PlatformSupport.Reflection
uses edge.jsonrpc.annotation.CaptchaCheck
uses edge.jsonrpc.exception.JsonRpcSecurityException
uses edge.security.EffectiveUser
uses gw.lang.reflect.IMethodInfo

uses jakarta.servlet.http.HttpServletResponse

/**
 * Http request processor. It knows how to handle (process or route) incoming requests.
 */
interface IRequestProcessor {
  /** Processes a request. "Processing" mean that response should be filled by the handler. It could be done by the
   * handler itself or by delegating some work to some other handler.
   */
  function process(user : EffectiveUser, req : HttpServletRequest, resp :  HttpServletResponse)

  function shouldCheckForCaptcha(method: IMethodInfo): boolean {
    var captchaSecret: String = ScriptParameters.CaptchaSecret
    var isMethodProtected = Reflection.hasAnnotation(method, CaptchaCheck)
    var isSecretSet = !String.isEmpty(captchaSecret)

    return isMethodProtected and isSecretSet
  }

  function checkCaptcha(method: IMethodInfo, req : HttpServletRequest, verifyCaptcha: IVerifyCaptcha) {
    if (shouldCheckForCaptcha(method)) {
      var captchaInfo = req.getHeader("x-captcha")
      var isValid: boolean = verifyCaptcha.verify(captchaInfo)

      if (!isValid) {
        throw new JsonRpcSecurityException(){:Message = "Captcha failed to verify"}
      }
    }
  }
}