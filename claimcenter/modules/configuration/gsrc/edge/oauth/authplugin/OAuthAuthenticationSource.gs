package edge.oauth.authplugin

uses gw.plugin.security.AuthenticationSource
uses com.nimbusds.jwt.JWTClaimsSet
uses com.fasterxml.jackson.databind.ObjectMapper

class OAuthAuthenticationSource implements AuthenticationSource {

  private static final var USERNAME_CLAIM_KEYS = {"pcUserName", "pc_username"}
  private static final var SCOPE_CLAIM_KEYS = 'scp'
  private static final var APPLICATION_ID_CLAIM = "cid"

  private static final var SERVICE_EDGE_USER_BEHALF = ".service.edge.user.behalf"
  private static final var SERVICE_EDGE_USER_AUTHORITIES = ".service.edge.user.authorities"
  static final var OBJECT_MAPPER = new ObjectMapper()

  public static enum xCenterOriginIDP {
    CLAIMCENTER, POLICYCENTER, BILLINGCENTER;
  }

  private var _claimSet : JWTClaimsSet as Claims
  private var _usernameClaimKey : String
  private var _scopeClaimKey : String
  private var _context : String
  private var _appCode: String

  public construct(claimSet : JWTClaimsSet, context : String) {

    this(claimSet)
    _context = context
    _appCode = com.guidewire.pl.system.server.Version.getAppCode().toLowerCase()
  }

  public construct(claimSet : JWTClaimsSet) {
    _claimSet = claimSet
    _usernameClaimKey = _claimSet.getClaims().keySet().firstWhere(\claimKey -> USERNAME_CLAIM_KEYS.contains(claimKey)) as String
    _scopeClaimKey = _claimSet.getClaims().keySet().firstWhere(\claimKey -> SCOPE_CLAIM_KEYS.equals(claimKey)) as String
  }

  property get Username() : String {
    var username = _claimSet.getStringClaim(_usernameClaimKey)
    return username != null ? username : _claimSet.getStringClaim("https://guidewire.com/username")
  }

  property get IsInternalUser() : Boolean {
    var username = _claimSet.getStringClaim(_usernameClaimKey)
    return username != null
  }

  property get IsServiceUser() : Boolean {

    var userBehalf = _appCode.concat(SERVICE_EDGE_USER_BEHALF)
    var scopes = _claimSet.getClaim(_scopeClaimKey) as ArrayList<String>
    return scopes?.firstWhere(\scope -> userBehalf.equals(scope)) != null
  }

  property get serviceUser() : String {

    var userBehalf = _appCode.concat(SERVICE_EDGE_USER_BEHALF)
    var scopes = _claimSet.getClaim(_scopeClaimKey) as ArrayList<String>
    var scope = scopes.firstWhere(\scope -> userBehalf.equals(scope))
    var node = OBJECT_MAPPER.readTree(_context)
    return node.get(scope)?.asText()
  }

  property get HasServiceUserAuthorities() : Boolean {

    var userAuthorities = _appCode.concat(SERVICE_EDGE_USER_AUTHORITIES)
    var scopes = _claimSet.getClaim(_scopeClaimKey) as ArrayList<String>
    return scopes?.firstWhere(\scope -> userAuthorities.equals(scope)) != null
  }

  property get serviceUserAuthorities() : List<String> {

    var serviceAuthoritiesScope = _appCode.concat(SERVICE_EDGE_USER_AUTHORITIES)
    var scopes = _claimSet.getClaim(_scopeClaimKey) as ArrayList<String>
    var scope = scopes.firstWhere(\scope -> serviceAuthoritiesScope.equals(scope))
    var node = OBJECT_MAPPER.readTree(_context)
    var userAuthorities =  node.get(scope)?.asText()
    return userAuthorities?.split(",")?.toList()
  }

  property get IsInternalUserForThisApplication() : Boolean {
    // Check whether this code is running in PC, the only source of authentication on granite on cloud.
    return com.guidewire.pl.system.server.Version.getAppCode().equalsIgnoreCase("pc")
  }

  property get IsJwtInvalidForThisApplication() : boolean {
    var oktaApplicationIds = ScriptParameters.OktaApplicationIds
    var jwtApplicationId = _claimSet.getStringClaim(APPLICATION_ID_CLAIM)

    return !oktaApplicationIds.contains(jwtApplicationId)
  }

  override property get Hash() : char[] {
    return _claimSet.JWTID.toCharArray()
  }

  override function determineSourceComplete() : boolean {
    return _claimSet != null
  }

}
