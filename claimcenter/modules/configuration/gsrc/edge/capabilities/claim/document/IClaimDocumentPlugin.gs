package edge.capabilities.claim.document

uses edge.PlatformSupport.Bundle
uses edge.capabilities.claim.document.dto.ClaimDocumentDTO
uses edge.capabilities.claim.document.dto.ClaimDocumentUploadDTO

/**
 * Plugin used for claim document operations. Plugin is responsible for all document access checks.
 */
interface IClaimDocumentPlugin {

  /**
   * Returns information about claim document accessible to the user.
   */
  function getClaimDocuments(claim : Claim) : ClaimDocumentDTO[]


  /**
   * Fetches detaised information about document.
   */
  function getDocumentDetails(doc : Document) : ClaimDocumentDTO


  /**
   * Creates a new document metadata using a given upload metadata.
   */
  function createDocumentMetadata(bundle : Bundle, claim : Claim, req : ClaimDocumentUploadDTO) :  Document


  /**
   * Deletes a document from the backend.
   */
  function deleteDocument(document : Document) : void
}
