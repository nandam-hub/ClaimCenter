package edge.Plugin

uses gw.plugin.policy.PolicySearchDataStore
uses gw.plugin.policy.base.PolicySearchPluginBase

/**
 * The demo version of the IPolicySearchAdapter.
 */
class PolicySearchPortalDemo extends PolicySearchPluginBase  {

  var _policyStore : PolicySearchPortalDemoDataStore
  
  /**
   * Lazily creates and gets the underlying demo policies.
   */
  override protected property get DataStore() : PolicySearchDataStore {
    if ( _policyStore == null ) {
      _policyStore = new PolicySearchPortalDemoDataStore()
    }
    return _policyStore
  }

  override function retrievePolicySummaryFromPolicy(oldPolicy: Policy): PolicySummary {
    var summary = super.retrievePolicySummaryFromPolicy(oldPolicy)
    if (summary != null) {
      fillAdditionalFields(summary)
    }
    return summary
  }

  override function searchPolicies(criteria: PolicySearchCriteria): PolicySearchResultSet {
    var result = super.searchPolicies(criteria)
    for (var summary in result.Summaries) {
      fillAdditionalFields(summary)
    }
    return result
  }

  // The right way to do this is to change PolicySearchUtil.convertPolicyToSummary() method,
  // but unfortunately PolicySearchUtil class is readonly
  private function fillAdditionalFields(summary: PolicySummary) {
    if (summary.PolicyType != TC_BUSINESSAUTO || summary.Vehicles.IsEmpty) {
      // optimization
      return
    }
    var policy = DataStore.getPolicy(summary.PolicyNumber, summary.LossDate)
    for (var vehicleSummary in summary.Vehicles) {
      var vehicleRU = policy.Vehicles.firstWhere(\vehicle -> summary.matchVehicle(vehicle, vehicleSummary))
      vehicleSummary.Year = vehicleRU.Vehicle.Year
    }
  }
}
