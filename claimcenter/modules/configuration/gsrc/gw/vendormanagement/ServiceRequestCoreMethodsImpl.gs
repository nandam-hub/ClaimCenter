package gw.vendormanagement

uses gw.core.vendormanagement.BaseServiceRequestCoreMethodsImpl

/**
 * Subclass of BaseServiceRequestCoreMethodsImpl, provided so customers can override methods and properties in the base implementation.
 * This class and its methods should not be used if Core Service Requests feature is disabled.
 * To use this class, please follow the instructions on the product documentation on how to enable the Core Service Requests feature.
 */
@Export
class ServiceRequestCoreMethodsImpl extends BaseServiceRequestCoreMethodsImpl {

  private final var _coreSR = new ConfigCoreSR();

  construct(serviceRequest : ServiceRequest) {
    super(serviceRequest)
  }

  @Override
  property get CoreSR() : CoreSR {
    //do not comment/remove this line if Core Service Requests feature is disabled
    checkCoreServiceRequestFeatureFlag()
    return _coreSR;
  }

  class ConfigCoreSR extends BaseCoreSR {

    override property get AlreadyPromoted() : boolean {
      return PromotionServiceRequest != null;
    }

    override property get PromotionServiceRequest() : ServiceRequest {
      var promotionSR : ServiceRequest = null
      var promotionServiceRequests = this.outer.ServiceRequest.getPromotionServiceRequests()
      if (!promotionServiceRequests.isEmpty()) {
        if (promotionServiceRequests.size() == 1) {
          promotionSR = promotionServiceRequests.get(0)
        } else {
          throw new IllegalStateException("Service request is promoted more than once")
        }
      }
      return promotionSR
    }
  }
}