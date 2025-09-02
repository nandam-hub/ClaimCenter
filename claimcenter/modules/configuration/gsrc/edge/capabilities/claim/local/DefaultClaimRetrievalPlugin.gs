package edge.capabilities.claim.local

uses edge.capabilities.claim.summary.IClaimSummaryPlugin
uses edge.capabilities.claim.summary.dto.ClaimSummaryResultDTO
uses edge.capabilities.claim.summary.dto.QueryOptionsDTO
uses edge.di.annotations.ForAllGwNodes
uses edge.security.authorization.AuthorityType
uses gw.api.database.Query
uses java.util.Set
uses edge.capabilities.claim.lob.ISupportedLobsPlugin
uses edge.PlatformSupport.Logger
uses edge.PlatformSupport.Reflection
uses java.lang.IllegalArgumentException
uses edge.security.authorization.Authorizer
uses edge.security.EffectiveUserProvider
uses edge.capabilities.claim.dto.ClaimSearchDTO
uses gw.api.database.IQuery
uses java.lang.Math
uses java.util.Arrays

/**
 * Default implementation of claim retrieval plugin.
 */
class DefaultClaimRetrievalPlugin implements IClaimRetrievalPlugin {

  private static final var LOGGER = new Logger(Reflection.getRelativeName(DefaultClaimRetrievalPlugin))

  private var _supportedLobsPlugin : ISupportedLobsPlugin

  private var _claimSummaryPlugin : IClaimSummaryPlugin

  private var _claimAuthorizer : Authorizer<Claim>

  private var _userProvider : EffectiveUserProvider as readonly UserProvider

  @ForAllGwNodes
  @Param("supportedLobsPlugin", "Plugin used to determine available lines of business")
  @Param("claimSummaryPlugin", "Plugin used to access claim summaries")
  @Param("claimAuthorizer", "Plugin used to determine claim access rules")
  construct(supportedLobsPlugin : ISupportedLobsPlugin, claimSummaryPlugin : IClaimSummaryPlugin, claimAuthorizer : Authorizer<Claim>, aUserProvider : EffectiveUserProvider) {
    this._supportedLobsPlugin = supportedLobsPlugin
    this._claimSummaryPlugin = claimSummaryPlugin
    this._claimAuthorizer = claimAuthorizer
    this._userProvider = aUserProvider
  }

  override function searchClaims(req : ClaimSearchDTO) : Claim[] {
    var user = UserProvider.EffectiveUser
    final var query = makeClaimQuery(req)
    if (query == null) {
      return new Claim[0]
    }

    LOGGER.logDebug("Final query is " + toString())

    var claims = query.select().toTypedArray()

    if (req.QueryText != null) {
      var text = req.QueryText
      claims = claims.where(\claim ->
          caseInsensitiveContains(claim.ClaimNumber, text) ||
          caseInsensitiveContains(claim.Insured?.DisplayName, text) ||
          caseInsensitiveContains(claim.State?.DisplayName, text))
    }

    final var result = _claimAuthorizer.access(claims)

    if (result.length != claims.length) {
      LOGGER.logWarn("Found mismatch between claim authorization restriction and claim query. Query claim count = " +
          claims.length + " accessible policies " +
          result.length + " for user " +
          user + " with authorities " + user.GrantedAuthorities)
    }

    return claims
  }

  override public function searchClaims(req : ClaimSearchDTO, queryOptions: QueryOptionsDTO) : ClaimSummaryResultDTO {
    final var authorizedClaims = sort(searchClaims(req))
    final var filteredClaims = filterClaims(authorizedClaims, queryOptions)

    final var result = new ClaimSummaryResultDTO()
    result.Items = filteredClaims.map(\claim -> _claimSummaryPlugin.getSummary(claim))
    result.MaxNumberOfResults = authorizedClaims.length

    return result
  }

  protected function filterClaims(claims : Claim[], queryOptions : QueryOptionsDTO) : Claim[] {
    // assume correct offsets, out of bound exceptions go back to client
    return queryOptions.OffsetEnd == null ?
        claims :
        Arrays.copyOfRange(claims, queryOptions.OffsetStart, Math.min(queryOptions.OffsetEnd + 1, claims.length))
  }

  override function getClaimByNumber(number : String) : Claim {
    if(number == null || number.Empty){
      throw new IllegalArgumentException("Claim number is null or empty")
    }

    final var claim = Claim.finder.findClaimByClaimNumber(number)
    return _claimAuthorizer.access(claim)
  }



  /**
   * Creates a claim query. Returns null if query is effectively "empty" 
   * (user have no authorities to access any claims). This implementation delegates to
   * make[Policy|Producer|Vendor]Query to get query for the specific authority target. 
   * Returned result is union of all results retrieved for the specific authority roles.
   */
  protected function makeClaimQuery(req : ClaimSearchDTO) : IQuery<Claim> {
    var res : IQuery<Claim> = null
    var user = UserProvider.EffectiveUser

    final var policyAuths = user.getTargets(AuthorityType.POLICY)
    if (!policyAuths.Empty) {
      res = union(res, makePolicyQuery(policyAuths, req))
    }

    final var producerAuths = user.getTargets(AuthorityType.PRODUCER)
    if (!producerAuths.Empty) {
      res = union(res, makeProducerQuery(producerAuths, req))
    }

    final var vendorAuths = user.getTargets(AuthorityType.VENDOR)
    if (!vendorAuths.Empty) {
      res = union(res, makeVendorQuery(vendorAuths, req))
    }

    final var accountAuths = user.getTargets(AuthorityType.ACCOUNT)
    if (!accountAuths.Empty) {
      res = union(res, makeAccountQuery(accountAuths,req))
    }

    if(res == null) {
      LOGGER.logDebug("Query is null as no authorities found")
    } else {
      LOGGER.logDebug(res.toString())
    }


    return res
  }


  protected function makeAccountQuery(account : Set<String>, req : ClaimSearchDTO) : Query<Claim> {
    final var q = makeCriteriaQuery(req)
    q.join("Policy").compareIn("AccountNumber", account.toTypedArray())
    return q
  }

  /**
   * Creates an policy-based claim query.
   */
  protected function makePolicyQuery(policies : Set<String>, req : ClaimSearchDTO) : Query<Claim> {
    final var q = makeCriteriaQuery(req)
    q.join("Policy").compareIn("PolicyNumber", policies.toTypedArray())
    return q
  }

  /**
   * Creates an producer-based authority query.
   */
  protected function makeProducerQuery(codes : Set<String>, req : ClaimSearchDTO) : Query<Claim> {
    final var q = makeCriteriaQuery(req)
    q.join("Policy").compareIn("ProducerCode", codes.toTypedArray())
    return q
  }



  /**
   * Creates an vendor-based authority query.
   */
  protected function makeVendorQuery(codes : Set<String>, req : ClaimSearchDTO) : Query<Claim> {
    final var q = makeCriteriaQuery(req)
    q.join(ClaimContact, "Claim").join("Contact").compareIn("AddressBookUID", codes.toArray())
    return q
  }


  /**
   * Creates a base claim search criteria. This query handles fields from request
   * but do not handle any security calls.
   */
  protected function makeCriteriaQuery(req : ClaimSearchDTO) : Query<Claim> {
    final var q = Query.make(Claim)
    q.compareIn("State", req.ClaimStates)
    if (req.PolicyType != null) {
      q.join("Policy").compare("PolicyType", Equals, req.PolicyType)
    } else {
      q.join("Policy").compareIn("PolicyType", _supportedLobsPlugin.getSupportedLobs())
    }
    return q
  }

  /**
   * Unions two queries into one.
   */
  protected static function union(q1 : IQuery<Claim>, q2 : IQuery<Claim>) : IQuery<Claim> {
    if (q1 == null) {
      return q2
    }
    if (q2 == null) {
      return q1
    }

    return q1.union(q2)
  }

  private function caseInsensitiveContains(string : String, token : String) : boolean {
    if (token == null || string == null) return false
    return string.toLowerCase().contains(token.toLowerCase())
  }

  private function sort(claims : Claim[]) : Claim[] {
    return claims.sort(\claim1, claim2 ->
      claim1.LossDate == claim2.LossDate ?
        claim1.ID > claim2.ID :
        claim1.LossDate.after(claim2.LossDate)
    )
  }
}
