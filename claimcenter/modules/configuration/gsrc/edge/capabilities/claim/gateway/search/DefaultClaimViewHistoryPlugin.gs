package edge.capabilities.claim.gateway.search

uses edge.di.annotations.ForAllGwNodes
uses edge.PlatformSupport.Logger
uses edge.PlatformSupport.Reflection
uses java.lang.IllegalArgumentException
uses edge.PlatformSupport.Bundle
uses edge.security.EffectiveUserProvider
uses edge.PlatformSupport.TranslateUtil

class DefaultClaimViewHistoryPlugin implements IClaimViewHistoryPlugin {

  final private static  var LOGGER = new Logger(Reflection.getRelativeName(DefaultClaimViewHistoryPlugin))
  final private static var MAXRECENTLYVIEWEDACCOUNTS = 25
  private var _userProvider : EffectiveUserProvider as readonly UserProvider

  @ForAllGwNodes
  construct(aUserProvider : EffectiveUserProvider) {
    this._userProvider = aUserProvider
  }


  /**
   * Returns the recently viewed Claims in a Guidewire Portal for the given user
   */
  override function getRecentlyViewedClaimsForEffectiveUser(): Claim[] {
    var aUser = UserProvider.EffectiveUser

    if (aUser == null){
      throw new IllegalArgumentException(TranslateUtil.translate("Edge.Capabilities.Claim.Agent.Search.UserMustNotBeNull"))
    }
    LOGGER.logDebug("Finding recently viewed claims for user: " + aUser.Username)
    var portalRecentlyViewed = gw.api.database.Query.make(PortalRecentlyViewed_Ext).compare("PortalUser", Equals, aUser.Username).select().AtMostOneRow

    if (portalRecentlyViewed != null){

      return portalRecentlyViewed.PortalClaims.sortByDescending(\aPortalClaim -> aPortalClaim.ViewedDate)*.ClaimInfo*.Claim
    }

    return new Claim[]{}
  }

  /**
   * adds a recently viewed Claim Guidewire Portal for the given user
   */
  override function addRecentlyViewedClaimForEffectiveUser(aClaim: Claim) {
    var aUser = UserProvider.EffectiveUser

    if (aUser == null){
      throw new IllegalArgumentException(TranslateUtil.translate("Edge.Capabilities.Claim.Agent.Search.UserMustNotBeNull"))
    }
    Bundle.transaction(\bundle -> {
      LOGGER.logDebug("Adding recently viewed claim: " + aClaim.ClaimNumber + " for user: " + aUser.Username)
      var portalRecentlyViewed = bundle.add(gw.api.database.Query.make(PortalRecentlyViewed_Ext).compare("PortalUser", Equals, aUser.Username).select().AtMostOneRow)

      if (portalRecentlyViewed == null){
        portalRecentlyViewed = new PortalRecentlyViewed_Ext()
        portalRecentlyViewed.PortalUser = aUser.Username
      }

      // If the claim has already been recently viewed, update its view date
      if (portalRecentlyViewed.PortalClaims != null && portalRecentlyViewed.PortalClaims.hasMatch(\aPortalClaim -> aPortalClaim.ClaimInfo.Claim == aClaim)) {

        var portalClaim = portalRecentlyViewed.PortalClaims.firstWhere(\aPortalClaim -> aPortalClaim.ClaimInfo.Claim == aClaim)
        portalClaim.ViewedDate = gw.api.util.DateUtil.currentDate()
      }
      else {
        // If there are the max recently viewed accounts, remove the account that was view least recently
        if (portalRecentlyViewed.PortalClaims.Count == MAXRECENTLYVIEWEDACCOUNTS){
          var portalClaims = portalRecentlyViewed.PortalClaims.sortBy(\aPortalClaim -> aPortalClaim.ViewedDate)
          portalClaims[0].PortalRecentlyViewed = null
        }

        var portalClaim = gw.api.database.Query.make(PortalClaim_Ext).compare("ClaimInfo", Equals, aClaim.ClaimInfo)
            .compare("PortalRecentlyViewed", Equals, portalRecentlyViewed).select().AtMostOneRow

        if (portalClaim == null){
          portalClaim = new PortalClaim_Ext()
          portalClaim.PortalRecentlyViewed = portalRecentlyViewed
          portalClaim.ClaimInfo = aClaim.ClaimInfo
          portalClaim.ViewedDate = gw.api.util.DateUtil.currentDate()
        }
      }
    })
  }
}
