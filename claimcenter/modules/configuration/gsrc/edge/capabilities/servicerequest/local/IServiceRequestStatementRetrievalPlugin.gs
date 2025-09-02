package edge.capabilities.servicerequest.local


/**
 * Plugin used to access service request data.
 * <p>Plugin implementation is responsible for service request access checks.
 */
interface IServiceRequestStatementRetrievalPlugin {

  /** Retrieves service request statement (quote or invoice) by its public ID. Returns <code>null</code> if statement was not found.*/
  public function getServiceRequestStatementFromPublicId(publicId : String) : ServiceRequestStatement
}
