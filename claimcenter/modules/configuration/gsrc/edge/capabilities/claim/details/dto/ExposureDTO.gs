package edge.capabilities.claim.details.dto

uses edge.jsonmapper.JsonProperty
uses edge.capabilities.claim.lob.claimdetail.dto.ClaimExposureLobDTO

class ExposureDTO {

  @JsonProperty  
  var _publicID : String as PublicID
  
  @JsonProperty
  var _coverageType: CoverageType as CoverageType
  @JsonProperty 
  var _exposureState: ExposureState as ExposureState 

  @JsonProperty
  var _lobs : ClaimExposureLobDTO as Lobs
}
