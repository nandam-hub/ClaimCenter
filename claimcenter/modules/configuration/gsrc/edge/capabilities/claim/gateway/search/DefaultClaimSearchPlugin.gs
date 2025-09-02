package edge.capabilities.claim.gateway.search

uses gw.api.database.IQueryBeanResult
uses edge.di.annotations.ForAllGwNodes
uses edge.capabilities.claim.gateway.search.dto.ClaimSearchResultDTO
uses java.lang.Integer
uses edge.servlet.security.IUserProducerCodeRetrievalPlugin
uses edge.security.EffectiveUserProvider
uses gw.api.filters.StandardQueryFilter
uses gw.entity.IEntityPropertyInfo
uses edge.capabilities.claim.summary.IClaimSummaryPlugin
uses java.lang.IllegalArgumentException
uses edge.PlatformSupport.TranslateUtil
uses edge.capabilities.helpers.pagination.IQueryPlugin
uses edge.capabilities.helpers.pagination.dto.QueryOptionsDTO
uses edge.capabilities.helpers.pagination.dto.QueryParameterDTO

class DefaultClaimSearchPlugin implements IClaimSearchPlugin {

    final private static var defaultCreatedInLastXDays = 30
    private var _claimSummaryPlugin : IClaimSummaryPlugin
    private var _claimSearchSummaryPlugin : IClaimSearchSummaryPlugin
    private var _queryPlugin : IQueryPlugin

    private var _userProducerCodeRetrieverPlugin : IUserProducerCodeRetrievalPlugin
    private var _userProvider : EffectiveUserProvider as readonly UserProvider

    @ForAllGwNodes
    construct(aClaimSummaryPlugin : IClaimSummaryPlugin, aQueryPlugin : IQueryPlugin, aUserProvider:EffectiveUserProvider, aUserProducerCodeRetrievalPlugin : IUserProducerCodeRetrievalPlugin, aClaimSearchSummaryPlugin: IClaimSearchSummaryPlugin) {
        this._claimSummaryPlugin = aClaimSummaryPlugin
        this._queryPlugin = aQueryPlugin
        this._userProvider = aUserProvider
        this._userProducerCodeRetrieverPlugin = aUserProducerCodeRetrievalPlugin
        this._claimSearchSummaryPlugin = aClaimSearchSummaryPlugin
    }

    override function getClaimsForCurrentUser(createdInLastXDays: Integer, queryOptions: QueryOptionsDTO, queryParameters: QueryParameterDTO[]): ClaimSearchResultDTO {
        var producerCodes = getProducerCodesForEffectiveUser()
        return getClaimsForProducerCodes(createdInLastXDays, producerCodes, queryOptions, queryParameters)
    }

    override function getOpenClaimsForCurrentUser(createdInLastXDays: Integer, queryOptions: QueryOptionsDTO, queryParameters: QueryParameterDTO[]): ClaimSearchResultDTO {
        var producerCodes = getProducerCodesForEffectiveUser()
        var claimQuery = getClaimQueryForProducerCodes(producerCodes, createdInLastXDays, queryOptions)

        applyQueryParameters(claimQuery, queryParameters)

        claimQuery.addFilter(new StandardQueryFilter("Only Open/Draft Claims", \query -> {
            query.or( \ orCriteria -> {
            orCriteria.compare("State", Equals, ClaimState.TC_OPEN)
        orCriteria.compare("State", Equals, ClaimState.TC_DRAFT)
    })
}))

final var claims = filterClaimsQueryResultsByOffset(claimQuery, queryOptions).toTypedArray()

return claimSearchResultsToDTO(claimQuery, claims)
}

override function getClosedClaimsForCurrentUser(createdInLastXDays: Integer, queryOptions: QueryOptionsDTO, queryParameters: QueryParameterDTO[]): ClaimSearchResultDTO {
    var producerCodes = getProducerCodesForEffectiveUser()
    var claimQuery = getClaimQueryForProducerCodes(producerCodes, createdInLastXDays, queryOptions)

    applyQueryParameters(claimQuery, queryParameters)

    claimQuery.addFilter(new StandardQueryFilter("Only Closed Claims", \query -> {
        query.compare("State", Equals, ClaimState.TC_CLOSED)
}))

final var claims = filterClaimsQueryResultsByOffset(claimQuery, queryOptions).toTypedArray()

return claimSearchResultsToDTO(claimQuery, claims)
}

override function getClaimsForProducerCodes(createdInLastXDays : Integer, producerCodes: String[], queryOptions : QueryOptionsDTO, queryParameters : QueryParameterDTO[]): ClaimSearchResultDTO {

    var claimQuery = getClaimQueryForProducerCodes(producerCodes, createdInLastXDays, queryOptions)

    applyQueryParameters(claimQuery, queryParameters)

    final var claims = filterClaimsQueryResultsByOffset(claimQuery, queryOptions).toTypedArray()

    return claimSearchResultsToDTO(claimQuery, claims)
}

override function getClaimsForProducerCode(createdInLastXDays: Integer, queryOptions: QueryOptionsDTO, aProducerCode: String): ClaimSearchResultDTO {
    checkProducerCodeIsValid(aProducerCode)
    return getClaimsForProducerCodes(createdInLastXDays, new String[]{aProducerCode}, queryOptions, null)
}

override function getOpenClaimsForProducerCode(createdInLastXDays: Integer, queryOptions: QueryOptionsDTO, aProducerCode: String): ClaimSearchResultDTO {
    checkProducerCodeIsValid(aProducerCode)

    var claimQuery = getClaimQueryForProducerCodes(new String[]{aProducerCode}, createdInLastXDays, queryOptions)

    claimQuery.addFilter(new StandardQueryFilter("Only Open/Draft Claims", \query -> {
        query.or( \ orCriteria -> {
        orCriteria.compare("State", Equals, ClaimState.TC_OPEN)
    orCriteria.compare("State", Equals, ClaimState.TC_DRAFT)
})}))

final var claims = filterClaimsQueryResultsByOffset(claimQuery, queryOptions).toTypedArray()
return claimSearchResultsToDTO(claimQuery, claims)
}

override function getClosedClaimsForProducerCode(createdInLastXDays: Integer, queryOptions: QueryOptionsDTO, aProducerCode: String): ClaimSearchResultDTO {
    checkProducerCodeIsValid(aProducerCode)

    var claimQuery = getClaimQueryForProducerCodes(new String[]{aProducerCode}, createdInLastXDays, queryOptions)

    claimQuery.addFilter(new StandardQueryFilter("Only Closed Claims", \query -> {
        query.compare("State", Equals, ClaimState.TC_CLOSED)
}))

final var claims = filterClaimsQueryResultsByOffset(claimQuery, queryOptions).toTypedArray()
return claimSearchResultsToDTO(claimQuery, claims)
}

protected function claimSearchResultsToDTO(aQueryResults : IQueryBeanResult, claims : Claim[]) : ClaimSearchResultDTO {
    final var claimSearchSummary = new ClaimSearchResultDTO ()

    claimSearchSummary.MaxNumberOfResults = aQueryResults.Count
    claimSearchSummary.Claims = _claimSearchSummaryPlugin.toDTOArray(claims)

    return claimSearchSummary
}

protected function getClaimQueryForProducerCodes(producerCodes : String[], createdInLastXDays : Integer, queryOptions : QueryOptionsDTO) : IQueryBeanResult{

    final var claimQuery = gw.api.database.Query.make(Claim).join("Policy").compareIn("ProducerCode", producerCodes).select()

    if(createdInLastXDays != null){
        final var dateFilter = getCreateTimeQueryFilter(createdInLastXDays)
        claimQuery.addFilter(dateFilter)
    }

    if(queryOptions.OrderBy != null){
        var prop = entity.Claim.Type.TypeInfo.getProperty(queryOptions.OrderBy) as IEntityPropertyInfo
        if(prop != null){
            if(queryOptions.OrderByDescending){
                claimQuery.orderByDescending(prop)
            }else{
                claimQuery.orderBy(prop)
            }
        }
    }

    return claimQuery
}

protected function getCreateTimeQueryFilter(createdInLastXDays: Integer): StandardQueryFilter {
    var currentDate = gw.api.util.DateUtil.currentDate()
    createdInLastXDays = createdInLastXDays ?: defaultCreatedInLastXDays

    return new StandardQueryFilter("Created in last X days", \query -> {
        query.between("CreateTime", currentDate.addDays(- createdInLastXDays).trimToMidnight(), currentDate)
})
}

protected function filterClaimsQueryResultsByOffset(claimQuery: IQueryBeanResult, queryOptions: QueryOptionsDTO): List<Claim> {
    final var claims = new ArrayList<Claim>()

    if (queryOptions.OffsetEnd != null) {
    var claimIterator = claimQuery.iterator(queryOptions.OffsetStart)
    for (var i in queryOptions.OffsetStart..queryOptions.OffsetEnd) {
        if (claimIterator.hasNext()) {
            claims.add(claimIterator.next() as Claim)
        } else {
            break
        }
    }
} else {
    claimQuery.each(\claim -> claims.add(claim as Claim))
}

return claims
}

protected function getProducerCodesForEffectiveUser(): String[] {
    var user = UserProvider.EffectiveUser
    return _userProducerCodeRetrieverPlugin.getUserProducerCodes(user.Username).toTypedArray()
}

protected function applyQueryParameters(claimQuery: IQueryBeanResult, queryParameters: QueryParameterDTO[]){
    if(queryParameters != null && queryParameters.HasElements){
        claimQuery = _queryPlugin.runQueryOperation(claimQuery, queryParameters)
    }
}

protected function checkEffectiveUserHasProducerCode(aProducerCode : String) : boolean {
    return getProducerCodesForEffectiveUser().contains(aProducerCode)
}

protected function checkProducerCodeIsValid(aProducerCode : String){
    if(aProducerCode == null){
        throw new IllegalArgumentException(TranslateUtil.translate("Edge.Capabilities.Claim.Agent.Search.ProducerCodeMustNotBeNull"))
    }

    if(!checkEffectiveUserHasProducerCode(aProducerCode)){
        throw new IllegalArgumentException(TranslateUtil.translate("Edge.Capabilities.Claim.Agent.Search.EffectiveUserMissingProducerCode"))
    }
}
}

