package parametric.batch.dto

class ClaimContactDTO {

  private var _attributes : ClaimContactAttributesDTO as attributes

  private var _method : String as method
  private var _refid : String as refid
  private var _uri : String as uri

  construct(attribute : ClaimContactAttributesDTO, mthod : String, refId : String, URI : String) {
    _attributes = attributes
    _method = mthod
    _refid = refId
    _uri = URI
  }
}