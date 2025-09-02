package edge.capabilities.servicerequest.local

uses edge.capabilities.helpers.pagination.dto.QueryOptionsDTO
uses edge.di.annotations.ForAllGwNodes
uses edge.PlatformSupport.Logger
uses java.lang.IllegalArgumentException

uses edge.exception.EntityPermissionException
uses edge.security.authorization.Authorizer
uses edge.security.EffectiveUserProvider
uses gw.api.database.Query
uses edge.security.authorization.AuthorityType
uses java.lang.IllegalStateException
uses edge.exception.EntityNotFoundException
uses edge.capabilities.servicerequest.local.IServiceRequestRetrievalPlugin
uses edge.PlatformSupport.Reflection
uses gw.api.database.Relop
uses gw.api.database.IQueryBeanResult
uses gw.entity.IEntityPropertyInfo
uses edge.capabilities.servicerequest.summary.dto.ServiceRequestSearchResultDTO
uses edge.capabilities.servicerequest.summary.IServiceRequestSummaryPlugin


uses java.util.Iterator

/**
 * Default implementation of claim retrieval plugin.
 */
class DefaultServiceRequestRetrievalPlugin implements IServiceRequestRetrievalPlugin {

  private static final var LOGGER = new Logger(Reflection.getRelativeName(DefaultServiceRequestRetrievalPlugin))
  private var _serviceRequestAuthorizer : Authorizer<ServiceRequest>
  private var _userProvider : EffectiveUserProvider as readonly UserProvider
  private var _serviceRequestSummaryPlugin : IServiceRequestSummaryPlugin as ServiceRequestSummaryPlugin


  @ForAllGwNodes
  @Param("serviceRequestAuthorizer", "Plugin used to determine service request access rules")
  construct(serviceRequestAuthorizer : Authorizer<ServiceRequest>, aUserProvider:EffectiveUserProvider, serviceRequestSummaryPlugin : IServiceRequestSummaryPlugin) {
    this._serviceRequestAuthorizer = serviceRequestAuthorizer
    this._userProvider = aUserProvider
    this._serviceRequestSummaryPlugin = serviceRequestSummaryPlugin
  }

  /**
   * Get a service request entity from a public id
   *
   * @param publicId The public id of the service request to look up
   * @return The service request entity
   * @throws IllegalArgumentException If public id is null or empty
   * @throws EntityNotFoundException If no service request is found
   * @throws EntityPermissionException If the portal user has no access to the service request
   */
  public function getServiceRequestFromPublicId(publicId : String) : ServiceRequest{
    if(publicId == null || publicId.Empty){
      throw new IllegalArgumentException("serviceRequestNumber is null or empty")
    }

    var q = Query.make(ServiceRequest)
    q.compare(ServiceRequest#PublicID, Equals, publicId)
    var queryResult = q.select()
    if (queryResult.Count > 1) {
      throw new IllegalStateException("found multiple ServiceRequests with the same PublicID")
    }
    var rawServiceRequestResult = queryResult.FirstResult
    if (rawServiceRequestResult == null){
      throw new EntityNotFoundException(){
          :Message = "No service request found",
          :Data = publicId
      }
    }
    var serviceRequest = _serviceRequestAuthorizer.access(rawServiceRequestResult)
    if(serviceRequest == null) {
      throw new EntityPermissionException() {
        :Message = "User not authorized to access service request",
        :Data = publicId
      }
    }
    return serviceRequest
  }
  /**
   * Get a service request entity from the service request number
   *
   * @param serviceRequestNumber The service request number the service request to look up
   * @return The service request entity
   * @throws IllegalArgumentException If serviceRequestNumber is null or empty
   * @throws EntityNotFoundException If no service request is found
   * @throws EntityPermissionException If the user has no access to the service request
   */
  public function getServiceRequestByNumber(serviceRequestNumber : String) : ServiceRequest {
    if(serviceRequestNumber == null || serviceRequestNumber.Empty){
      throw new IllegalArgumentException("serviceRequestNumber is null or empty")
    }

    var q = Query.make(ServiceRequest)
    q.compare(ServiceRequest#ServiceRequestNumber, Equals, serviceRequestNumber)
    var queryResult = q.select()
    if (queryResult.Count > 1) {
      throw new IllegalStateException("found multiple ServiceRequests with the same ServiceRequestNumber")
    }
    var rawServiceRequestResult = queryResult.FirstResult
    if (rawServiceRequestResult == null){
      throw new EntityNotFoundException(){
          :Message = "No service request found",
          :Data = serviceRequestNumber
      }
    }
    var serviceRequest = _serviceRequestAuthorizer.access(rawServiceRequestResult)
    if(serviceRequest == null) {
      throw new EntityPermissionException() {
        :Message = "User not authorized to access service request",
        :Data = serviceRequestNumber
      }
    }
    return serviceRequest
  }

  public function getAllServiceRequestsForVendor() : ServiceRequest[] {
    final var user = UserProvider.EffectiveUser
    final var vendorAuths = user.getTargets(AuthorityType.VENDOR)

    if (vendorAuths.Empty) {
      LOGGER.logDebug("Query is null as no authorities found")
      return {}
    }

    final var query = Query.make(ServiceRequest)
    query.join("Specialist").compareIn("AddressBookUID", vendorAuths.toArray())
    return query.select().toTypedArray()
  }

  override function getRequestTypeForVendor(requestType : String, paginationInfo : QueryOptionsDTO) : ServiceRequestSearchResultDTO {

    final var serviceRequestSearchResults = new ServiceRequestSearchResultDTO ()

    final var user = UserProvider.EffectiveUser
    final var vendorAuths = user.getTargets(AuthorityType.VENDOR)

    if (vendorAuths.Empty) {
      LOGGER.logDebug("Query is null as no authorities found")
      return null
    }

    var requestTypeQuery = Query.make(ServiceRequest)

    if(requestType!='All') {
      requestTypeQuery.compare(ServiceRequest#Kind, Relop.Equals, ServiceRequestKind.get(requestType))
    }

    var updatedRequestTypeQuery = requestTypeQuery.join(ServiceRequest#Specialist)
        .compareIn(Contact#AddressBookUID, vendorAuths.toArray(new String[vendorAuths.size()]))
        .select()

    serviceRequestSearchResults.MaxNumberOfResults = updatedRequestTypeQuery.Count

    if(paginationInfo.OrderBy != null){
      var prop = ServiceRequest.Type.TypeInfo.getProperty(paginationInfo.OrderBy) as IEntityPropertyInfo
      if(prop != null){
        if(paginationInfo.OrderByDescending){
          updatedRequestTypeQuery.orderByDescending(prop)
        }else{
          updatedRequestTypeQuery.orderBy(prop)
        }
      }
    }

    var serviceRequests = filterRequestTypeQueryResultsByOffset(updatedRequestTypeQuery, paginationInfo).toTypedArray()

    serviceRequestSearchResults.ServiceRequests = ServiceRequestSummaryPlugin.mapSummaries(serviceRequests)

    return serviceRequestSearchResults

  }


  protected function getVendorQueryForRequestType(requestType : String, vendorAuths : Set<String>,  queryOptions : QueryOptionsDTO) : IQueryBeanResult{

    var requestTypeQuery = Query.make(ServiceRequest)

        if(requestType!='All') {
          requestTypeQuery.compare(ServiceRequest#Kind, Relop.Equals, ServiceRequestKind.get(requestType))
        }

    var updatedRequestTypeQuery = requestTypeQuery.join(ServiceRequest#Specialist)
        .compareIn(Contact#AddressBookUID, vendorAuths.toArray(new String[vendorAuths.size()]))
        .select()

    if(queryOptions.OrderBy != null){
      var prop = ServiceRequest.Type.TypeInfo.getProperty(queryOptions.OrderBy) as IEntityPropertyInfo
      if(prop != null){
        if(queryOptions.OrderByDescending){
          updatedRequestTypeQuery.orderByDescending(prop)
        }else{
          updatedRequestTypeQuery.orderBy(prop)
        }
      }
    }

    return updatedRequestTypeQuery
  }

  protected function filterRequestTypeQueryResultsByOffset(requestTypeQuery: IQueryBeanResult, queryOptions: QueryOptionsDTO): List<ServiceRequest> {
    final var requestTypeList = new ArrayList<ServiceRequest>()

    if (queryOptions.OffsetEnd != null) {
      var serviceRequestIterator = requestTypeQuery.iterator(queryOptions.OffsetStart)
      for (var i in queryOptions.OffsetStart..queryOptions.OffsetEnd) {
        if (serviceRequestIterator.hasNext()) {
          requestTypeList.add(serviceRequestIterator.next() as ServiceRequest)
        } else {
          break
        }
      }
    } else {
      requestTypeQuery.each(\serviceRequest -> requestTypeList.add(serviceRequest as ServiceRequest))
    }

    return requestTypeList
  }

}
