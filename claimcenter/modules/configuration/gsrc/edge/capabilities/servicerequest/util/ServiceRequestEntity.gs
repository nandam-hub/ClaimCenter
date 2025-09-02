package edge.capabilities.servicerequest.util

/**
 * Provided to solve platforms code differences
 */
class ServiceRequestEntity {
  /**
   * Gives a service request entity from a service request statement
   */
  public static function getFromStatement(serviceRequestStatement : ServiceRequestStatement) : entity.ServiceRequest {
    return serviceRequestStatement.getServiceRequest()
  }
}
