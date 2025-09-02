package edge.Plugin

uses gw.plugin.policy.search.IPolicySearchAdapter
uses gw.plugin.pcintegration.pc1000.PolicySearchPCPlugin
uses java.util.Map
uses gw.plugin.InitializablePlugin
uses gw.lang.reflect.IType
uses java.lang.Exception

/**
 * ClaimCenter only supports policy search integrations with PolicyCenter for Personal Auto and 
 * Workers Comp OOTB. So in order to have one integration point that can handle both Personal Auto 
 * and Homeowners. This class acts as wrapper, by using the OOTB integration code for CC-PC when 
 * searching for a Personal Auto policy and using locally searhable set of data when searching for 
 * Homeowners policies. 
 */
class PolicySearchPortal implements IPolicySearchAdapter, InitializablePlugin{
  
  private var pcIntegrationPlugin: PolicySearchPCPlugin
  private var demoIntegrationPlugin: PolicySearchPortalDemo
  
  private var credentials : Map

  construct() {}
  
  private function policySearchPlugin(type: IType): IPolicySearchAdapter{
    switch(type){
      case PolicySearchPortalDemo:
        if(demoIntegrationPlugin == null){
          demoIntegrationPlugin = new PolicySearchPortalDemo()    
        }
        return demoIntegrationPlugin
      case PolicySearchPCPlugin:
      default:
        if(pcIntegrationPlugin == null){
          pcIntegrationPlugin = new PolicySearchPCPlugin()
        }
        pcIntegrationPlugin.Parameters = credentials
        return pcIntegrationPlugin
    }
  }
    
  override function retrievePolicyFromPolicy(policy: Policy): PolicyRetrievalResultSet {
    var resultSet : PolicyRetrievalResultSet
    resultSet = policySearchPlugin(PolicySearchPortalDemo).retrievePolicyFromPolicy(policy)
    if ( resultSet.Result == null ) {
      resultSet = policySearchPlugin(PolicySearchPCPlugin).retrievePolicyFromPolicy(policy)
    }
    return resultSet
  }

  override function retrievePolicyFromPolicySummary(policySummary: PolicySummary): PolicyRetrievalResultSet {
    var resultSet = policySearchPlugin(PolicySearchPortalDemo).retrievePolicyFromPolicySummary(policySummary)
    if(resultSet.Result == null ){
      resultSet = policySearchPlugin(PolicySearchPCPlugin).retrievePolicyFromPolicySummary(policySummary)
    }
    return resultSet
  }

  override function retrievePolicySummaryFromPolicy(policy: Policy): PolicySummary { 
    var policySummary = policySearchPlugin(PolicySearchPortalDemo).retrievePolicySummaryFromPolicy(policy)
    if(policySummary == null){
      policySummary = policySearchPlugin(PolicySearchPCPlugin).retrievePolicySummaryFromPolicy(policy)
    }
    return policySummary
  }

  override function searchPolicies(criteria: PolicySearchCriteria): PolicySearchResultSet {   
    var resultSet : PolicySearchResultSet
      resultSet = policySearchPlugin(PolicySearchPortalDemo).searchPolicies(criteria)
    try {
    policySearchPlugin(PolicySearchPCPlugin).searchPolicies(criteria).Summaries.each(
        \ s -> resultSet.addToSummaries(s)
      )
    }catch(e:Exception) {
    }
    return resultSet
  }
  
  override property set Parameters(params: Map){
    credentials = params    
  }

}
