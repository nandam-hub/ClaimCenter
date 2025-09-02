package edge.capabilities.servicerequest.document.dto

uses edge.jsonmapper.JsonProperty
uses edge.capabilities.document.dto.DocumentBaseDTO
uses edge.aspects.validation.annotations.Required

/**
 * Extends the basic document DTO to associate documents with service requests.
*/
class ServiceRequestDocumentDTO extends DocumentBaseDTO{

  @JsonProperty @Required
  var _serviceRequestId : String as ServiceRequestId
}
