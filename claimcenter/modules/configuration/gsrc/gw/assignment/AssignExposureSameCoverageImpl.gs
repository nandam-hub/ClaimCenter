package gw.assignment

uses gw.api.assignment.ExposureAssignSimilarMethodsImpl

class AssignExposureSameCoverageImpl extends ExposureAssignSimilarMethodsImpl {
  public static property get EnableRoundRobinSimilarExposures_Ext(): Boolean{
    return ScriptParameters.getParameterValue("EnableRoundRobinSimilarExposures_Ext") as Boolean
  }
  public static property get EnableRoundRobinForExposures_Ext(): Boolean{
    return ScriptParameters.getParameterValue("EnableRoundRobinForExposures_Ext") as Boolean
  }

  public static property get EnableWeightedWorkload_Ext(): Boolean{
    return ScriptParameters.getParameterValue("EnableWeightedWorkload_Ext") as Boolean
  }


  construct(owner : Exposure) {
    super(owner)
  }

  override function isSimilar(exposure : Exposure) : boolean {
    // Check that we are comparing exposures of the same claim
    if (exposure.Claim != Owner.Claim) {
      return false
    }

    // Compare coverage type
    return exposure.PrimaryCoverage != null
        and Owner.PrimaryCoverage != null
        and exposure.PrimaryCoverage == Owner.PrimaryCoverage
  }
}
