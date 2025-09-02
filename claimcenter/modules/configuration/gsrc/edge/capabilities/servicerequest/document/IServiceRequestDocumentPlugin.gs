package edge.capabilities.servicerequest.document

uses edge.capabilities.servicerequest.document.dto.ServiceRequestDocumentDTO
uses edge.PlatformSupport.Bundle
uses gw.webservice.cc.cc1000.vendormanagement.DocumentContent

interface IServiceRequestDocumentPlugin {

  /**
   * Creates a DTO from an existing Service Request Message.
   */
  public function mapDocuments(srds : Document[]) : ServiceRequestDocumentDTO[]

  /**
   * Creates a DTO from an existing Service Request Message.
   */
  public function toDTO(doc : Document) : ServiceRequestDocumentDTO

  /**
   * Deletes a document from the backend.
   */
  function deleteDocument(req : ServiceRequest, document : Document) : void

  /**
   * Creates a new document metadata using a given upload metadata.
   */
  function createDocumentMetadata(bundle : Bundle, serviceRequest : ServiceRequest,
    req : ServiceRequestDocumentDTO, docContent : DocumentContent) : Document
}
