package edge.util.platformenhancement

enhancement ScriptParametersEnhancement: ScriptParameters {
  public static property get AllowedResetPasswordUrls(): String{
    return ScriptParameters.getParameterValue("AllowedResetPasswordUrls") as String
  }

  public static property get AllowedDocumentRetrievalRedirectUrls(): String{
    return ScriptParameters.getParameterValue("AllowedDocumentRetrievalRedirectUrls") as String
  }
}
