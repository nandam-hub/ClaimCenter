package edge.capabilities.claim.lob.impl.commonauto.dto

uses edge.jsonmapper.JsonProperty
uses java.lang.Integer
uses edge.capabilities.claim.policy.dto.CoverageDTO
uses edge.aspects.validation.annotations.Size
uses edge.aspects.validation.annotations.Required
uses edge.aspects.validation.annotations.FilterByCategory
uses edge.aspects.validation.annotations.Year

class VehicleDTO {
  @JsonProperty
  var _publicId : String as PublicID

  @JsonProperty
  var _policySystemId : String as PolicySystemId

  @JsonProperty
  var _tempId : String as TempID

  @JsonProperty @Size(0, 40)
  var _color : String as Color
  
  @JsonProperty @Size(0, 40)
  var _licensePlate : String as LicensePlate
  
  @JsonProperty @Size(0, 40) @Required
  var _make : String as Make
  
  @JsonProperty
  var _manufacturer : typekey.VehicleManufacturer as Manufacturer
  
  @JsonProperty @Size(0, 40) @Required
  var _model : String as Model
   
  @JsonProperty @FilterByCategory("Country")
  var _state : typekey.Jurisdiction as State
  
  @JsonProperty @Size(1, 40)
  var _vin : String as VIN
  
  @JsonProperty @Year @Required
  var _year : Integer as Year
  
  @JsonProperty  // @ReadOnly
  var _country : typekey.Country as Country
  
  @JsonProperty  // @ReadOnly
  var _coverages : CoverageDTO[] as Coverages
  
  @JsonProperty  // @ReadOnly
  var _policyVehicle : Boolean as PolicyVehicle

}
