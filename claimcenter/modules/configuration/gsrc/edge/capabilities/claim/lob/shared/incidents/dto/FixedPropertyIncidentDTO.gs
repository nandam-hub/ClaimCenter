package edge.capabilities.claim.lob.shared.incidents.dto

uses edge.jsonmapper.JsonProperty
uses edge.aspects.validation.annotations.Size

/**
 * Shared information about fixed property incident. This incident may be used by different
 * LOBs like Personal auto and homeowners.
 */
class FixedPropertyIncidentDTO {
  
  @JsonProperty
  var _publicId : String as PublicID
  
  @JsonProperty @Size(0, 1333)
  var _description : String as Description
    
  @JsonProperty @Size(0, 1333)
  var _propertyDescription : String as PropertyDescription

}
