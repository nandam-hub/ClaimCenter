package gw.webservice.cc.cc5000.vendormanagement

uses gw.xml.ws.annotation.WsiExportable

/**
 * Contains information to identify a service request and its claim.
 */
@Export
@WsiExportable("http://guidewire.com/cc/ws/gw/webservice/cc/cc5000/vendormanagement/ServiceRequestReference")
final class ServiceRequestReference {

  /**
  * The customer contact
  */
  var _customerContact : gw.webservice.cc.cc5000.vendormanagement.ContactSummary as CustomerContact

  /**
   * The claim number for the service request's claim.
   */
  var _claimNumber : String as ClaimNumber

  /**
   * The service request number.
   */
  var _serviceRequestNumber : String as ServiceRequestNumber

  /**
   * The service request reference number.
   */
  var _serviceRequestReferenceNumber : String as ServiceRequestReferenceNumber

  /**
   * The requested services
  */
  var _servicesRequested : List<gw.webservice.cc.cc5000.vendormanagement.Service> as ServicesRequested

  construct() {}

  construct(serviceRequest : ServiceRequest) {
    ClaimNumber = serviceRequest.Claim.ClaimNumber
    CustomerContact = new ContactSummary(serviceRequest.Instruction.CustomerContactGw)
    ServiceRequestNumber = serviceRequest.ServiceRequestNumber
    ServiceRequestReferenceNumber = serviceRequest.ServiceRequestReferenceNumberGw
    ServicesRequested = serviceRequest.Instruction.Services.map(\ s -> new Service(s.Service.Code,s.Service.Name)).toList()
  }
}