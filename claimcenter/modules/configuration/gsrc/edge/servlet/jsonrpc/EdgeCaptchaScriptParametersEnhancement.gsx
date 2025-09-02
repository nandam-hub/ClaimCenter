package edge.servlet.jsonrpc

enhancement EdgeCaptchaScriptParametersEnhancement : ScriptParameters {

  public static property get CaptchaSecret(): String {
    return ScriptParameters.getParameterValue("CaptchaSecret") as String
  }
}
