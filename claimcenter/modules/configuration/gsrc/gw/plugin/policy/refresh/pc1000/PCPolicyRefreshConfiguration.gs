package gw.plugin.policy.refresh.pc1000

uses com.google.common.base.Joiner
uses gw.api.policy.refresh.PolicyExtractor
uses gw.api.policy.refresh.pcintegration.PCPolicyGraph
uses gw.plugin.pcintegration.pc1000.PolicySearchConverter
uses gw.plugin.policy.refresh.PolicyRefreshConfigurationBase

/**
 * Policy refresh configuration for use when integrating with PolicyCenter 7.x. Automatically finds which types should
 * be considered during policy refresh by examining the XSD types in the PC integration web service.
 */
@Export
class PCPolicyRefreshConfiguration extends PolicyRefreshConfigurationBase {

  var _policyExtractor:PolicyExtractor

  construct() {
    var schema = wsi.remote.gw.webservice.pc.pc1000.entities.util.SchemaAccess.Blueprint
    var rootComplexType = schema.ComplexType.firstWhere( \ ct -> ct.Name=="CCPolicy")
    var pcPolicyGraph = new PCPolicyGraph(schema,
        rootComplexType.$TypeInstance, NamespacePrefix, PolicySearchConverter.INSTANCE.NameMapper)
    _policyExtractor = new PolicyExtractor(pcPolicyGraph.TypeGraph)
  }

  override function getPolicyExtractor(policy : Policy) : PolicyExtractor {
    return _policyExtractor
  }

  private property get NamespacePrefix() : String {
    var nsElems = wsi.remote.gw.webservice.pc.pc1000.entities.util.Type.Namespace.split("[.]")
    return Joiner.on(".").join(Arrays.copyOfRange(nsElems, 0, nsElems.length-1))
  }
}
