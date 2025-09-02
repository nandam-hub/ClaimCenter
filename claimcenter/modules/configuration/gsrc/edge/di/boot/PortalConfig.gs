package edge.di.boot

uses java.util.List
uses gw.util.Pair
uses edge.di.CapabilityAndPath
uses edge.di.solver.RuleDefn
uses java.util.Collections

/**
 * General (merged) portal configuration for all capabilities. 
 * It is usually (slightly) better 
 * to load all portals and capabilities at the same time instead of loading portals for each 
 * capability.
 */
final class PortalConfig {

  internal static final var EMPTY : PortalConfig = new PortalConfig(Collections.emptyList(), Collections.emptyList())

  /** Public injection rules. */
  var _publicRules : List<Pair<CapabilityAndPath, RuleDefn>> as readonly PublicRules
  
  /** Private portas configuration rules. */
  var _privateRules : List<Pair<CapabilityAndPath, RuleDefn>> as readonly PrivateRules

  construct(pubR : List<Pair<CapabilityAndPath, RuleDefn>>, privR : List<Pair<CapabilityAndPath, RuleDefn>>) {
    this._publicRules = pubR
    this._privateRules = privR
  }


  internal static function combine(configs : List<PortalConfig>) : PortalConfig {
    final var pubs = configs.flatMap( \ conf -> conf.PublicRules)
    final var privs = configs.flatMap( \ conf -> conf.PrivateRules)
    return new PortalConfig(pubs, privs)
  }

}
