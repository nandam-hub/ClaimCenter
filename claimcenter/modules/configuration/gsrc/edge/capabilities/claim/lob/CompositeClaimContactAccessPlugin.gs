package edge.capabilities.claim.lob
uses edge.security.EffectiveUser
uses java.util.Map
uses edge.di.boot.Bootstrap
uses edge.di.CapabilityAndPath
uses edge.di.Path
uses edge.di.annotations.ForAllGwNodes

/**
 * Claim access plugin which delegates actual work to lob plugins.
 * This plugin allows user to access contact iff at least  one of peer
 * plugins allows to access that contact.
 */
final class CompositeClaimContactAccessPlugin implements IClaimContactAccessPlugin {

  private var _lobMap : Map<String, IClaimContactAccessPlugin>

  @ForAllGwNodes
  construct() {
    //Using Bootstrap as a service locator until DI framework evolves to support injecting a map of dependencies
    _lobMap = Bootstrap.forceCreateMap< IClaimContactAccessPlugin >(new CapabilityAndPath("claim", Path.parse("claimcontactaccess.lob")))
  }



  override function haveAccess(user : EffectiveUser, contact : ClaimContact) : boolean {
    return _lobMap.values().hasMatch(\ p -> p.haveAccess(user, contact))
  }

}
