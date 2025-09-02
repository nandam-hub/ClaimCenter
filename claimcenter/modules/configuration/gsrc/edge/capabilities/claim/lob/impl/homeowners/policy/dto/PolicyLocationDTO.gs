package edge.capabilities.claim.lob.impl.homeowners.policy.dto

uses edge.jsonmapper.JsonProperty
uses edge.capabilities.address.dto.AddressDTO
uses edge.capabilities.claim.policy.dto.CoverageDTO

class PolicyLocationDTO {

  @JsonProperty  
  private var _publicID : String as PublicID
  
  @JsonProperty
  private var locNumber: String as LocationNumber
  
  @JsonProperty
  private var locDescription: String as LocationDescription
  
  @JsonProperty
  private var locAddress: AddressDTO as LocationAddress  
  
  @JsonProperty
  private var locHaslistedItems: boolean as HasListedItems
  
  @JsonProperty
  private var locCoverages: CoverageDTO[] as Coverages
}
