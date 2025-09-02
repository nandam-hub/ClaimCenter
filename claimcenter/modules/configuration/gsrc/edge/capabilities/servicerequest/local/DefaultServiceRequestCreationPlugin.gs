package edge.capabilities.servicerequest.local

uses java.lang.IllegalArgumentException

uses edge.di.annotations.ForAllGwNodes
uses gw.api.contact.ContactSystemUtil
uses gw.api.database.Query
uses gw.api.databuilder.CompanyBuilder
uses gw.api.databuilder.ContactTagBuilder
uses gw.api.databuilder.ServiceRequestBuilder
uses edge.capabilities.servicerequest.dto.ServiceRequestDTO
uses edge.capabilities.claim.contact.dto.ContactDTO

/**
 * Creates service request for testing purposes
 */
class DefaultServiceRequestCreationPlugin implements IServiceRequestCreationPlugin {

  private var _serviceRequestPlugin : IServiceRequestPlugin as ServiceRequestPlugin

  @Param("serviceRequestPlugin", "Plugin used to modify service requests.")
  @ForAllGwNodes
  construct(serviceRequestPlugin : IServiceRequestPlugin) {
    this._serviceRequestPlugin = serviceRequestPlugin
  }

  override function createServiceRequest(claimNumber : String, serviceKind : ServiceRequestKind, submitInstruction : Boolean) : ServiceRequestDTO {
    var srNumber = getServiceRequestNumber();
    var serviceRequestDTO : ServiceRequestDTO;

    gw.transaction.Transaction.runWithNewBundle(\bundle -> {

      var claim = Claim.finder.findClaimByClaimNumber(claimNumber)
      if (claim == null) {
        throw new IllegalArgumentException("Claim not found")
      }
      bundle.add(claim)
      var company = CompanyBuilder
          .uiReadyCompanyOfType(AutoRepairShop)
          .withTaxID("156-05-" + srNumber)
          .withCompanyName("Vendor " + srNumber)
          .withTag(new ContactTagBuilder().withType(ContactTagType.TC_VENDOR))

      var serviceRequest = getServiceRequestBuilder(serviceKind, company)
          //override SRNumber as it starts from id 1000 after each restart of the system and might clash with existing ids
          .withServiceRequestNumber(srNumber)
          .onClaim(claim)
          .create(bundle)

      if (submitInstruction) {
        serviceRequest.CoreSR.performOperation(TC_SUBMITINSTRUCTION, null, false)
      }

      var linkResult = ContactSystemUtil.INSTANCE.linkToContactSystem(company.getLastCreatedBean())
      serviceRequestDTO = _serviceRequestPlugin.toDTO(serviceRequest)
      serviceRequestDTO.Vendor= getVendorDTO(company.getLastCreatedBean(), linkResult.MatchingContact)
    })
    return serviceRequestDTO
  }

  private function getVendorDTO(vendor : Contact, abUID: String): ContactDTO {
    var vendorDTO = new ContactDTO()
    vendorDTO.ContactName = vendor.DisplayName
    vendorDTO.PublicID = vendor.PublicID
    vendorDTO.AddressBookUID = abUID
    vendorDTO.EmailAddress1 = vendor.EmailAddress1
    vendorDTO.TaxID = vendor.TaxID
    return vendorDTO
  }

  private function getServiceRequestNumber() : String {
    var nextSrNumberValue = "1000";
    var serviceRequests = Query.make(ServiceRequest)
        .select()
    if (!serviceRequests.isEmpty()) {
      nextSrNumberValue = String.valueOf(serviceRequests
          .toList()
          .map(\elt -> elt.getServiceRequestNumber().toInt())
          .order()
          .last() + 1)
    }
    return nextSrNumberValue
  }

  private function getServiceRequestBuilder(serviceKind : ServiceRequestKind, company: CompanyBuilder): ServiceRequestBuilder {
    switch (serviceKind) {
      case ServiceRequestKind.TC_SERVICEONLY:
        return ServiceRequestBuilder
            .uiReadyServiceOnly()
            .withSpecialist(company)
      case ServiceRequestKind.TC_QUOTEONLY:
        return ServiceRequestBuilder
            .uiReadyQuoteOnly()
            .withSpecialist(company)
      case ServiceRequestKind.TC_QUOTEANDSERVICE:
        return ServiceRequestBuilder
            .uiReadyAutoRepair()
            .withSpecialist(company)
      default:
        return ServiceRequestBuilder
            .uiReady()
            .withSpecialist(company)
    }
  }
}
