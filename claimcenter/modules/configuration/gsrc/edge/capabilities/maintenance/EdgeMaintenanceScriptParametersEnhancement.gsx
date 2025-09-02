package edge.capabilities.maintenance

enhancement EdgeMaintenanceScriptParametersEnhancement: ScriptParameters {
    public static property get EnableEdgeMaintenanceMode(): Boolean {
        return ScriptParameters.getParameterValue("EnableEdgeMaintenanceMode") as Boolean
    }
}
