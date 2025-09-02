package edge.capabilities.servicerequest.local

uses edge.security.authorization.Authorizer
uses edge.di.annotations.ForAllGwNodes
uses edge.security.EffectiveUserProvider
uses java.lang.IllegalArgumentException
uses java.lang.IllegalStateException
uses gw.api.database.Query
uses edge.exception.EntityNotFoundException
uses edge.capabilities.servicerequest.local.IServiceRequestStatementRetrievalPlugin

/**
 * Retrieves service request objects from the db, wrapping calls to the Query API to insulate the client code from
 * changes to the Query API across platform versions
 */
class DefaultServiceRequestStatementRetrievalPlugin implements IServiceRequestStatementRetrievalPlugin{

  private var _userProvider : EffectiveUserProvider as readonly UserProvider
  private var _serviceRequestStatementAuthorizer : Authorizer<ServiceRequestStatement>

  @ForAllGwNodes
  @Param("serviceRequestAuthorizer", "Plugin used to determine service request access rules")
  construct(serviceRequestAuthorizer : Authorizer<ServiceRequestStatement>, aUserProvider:EffectiveUserProvider) {
    this._serviceRequestStatementAuthorizer = serviceRequestAuthorizer
    this._userProvider = aUserProvider
  }

  /**
   * Get a service request statement entity from a public id
   *
   * @param publicId The public id of the service request to look up
   * @return The service request statement entity
   * @throws IllegalArgumentException If public id is null or empty
   * @throws EntityNotFoundException If no service request statement is found
   * @throws AuthorizationException If the portal user has no access to the service request statement
   */
  public function getServiceRequestStatementFromPublicId(publicId : String) : ServiceRequestStatement{
    if(publicId == null || publicId.Empty){
      throw new IllegalArgumentException("publicId is null or empty")
    }

    var q = Query.make(ServiceRequestStatement)
    q.compare(ServiceRequestStatement#PublicID, Equals, publicId)
    var queryResult = q.select()
    if (queryResult.Count > 1) {
      throw new IllegalStateException("found multiple Service Request statements with the same PublicId")
    }
    var statement = queryResult.FirstResult
    if (statement == null){
      throw new EntityNotFoundException(){
          :Message = "No statement found",
          :Data = publicId
      }
    }
    return _serviceRequestStatementAuthorizer.access(statement)
  }
}
