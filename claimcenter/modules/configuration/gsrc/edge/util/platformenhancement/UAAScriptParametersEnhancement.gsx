package edge.util.platformenhancement

enhancement UAAScriptParametersEnhancement: ScriptParameters {
  public static property get AuthServerUrl(): String{
    return ScriptParameters.getParameterValue("AuthServerUrl") as String
  }

  public static property get AuthServerPublicKeysEndpoint(): String{
    return ScriptParameters.getParameterValue("AuthServerPublicKeysEndpoint") as String
  }

  public static property get EnablePortalSingleSignOff(): Boolean{
    return ScriptParameters.getParameterValue("EnablePortalSingleSignOff") as Boolean
  }

  public static property get EnableUaaPortalAuthConsole(): Boolean{
    return ScriptParameters.getParameterValue("EnableUaaPortalAuthConsole") as Boolean
  }

  public static property get OktaApplicationIds(): List<String> {
    var applicationIdsString = ScriptParameters.getParameterValue("OktaApplicationId") as String
    if(applicationIdsString.contains(",")) {
      return applicationIdsString.split(",").toList()
    }
    return {applicationIdsString}
  }

}
