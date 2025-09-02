package edge.capabilities.enrollment.dto

uses java.util.HashMap
uses edge.jsonmapper.JsonProperty

class EnrollmentRequestDTO {

  @JsonProperty
  private var _type:String as Type

  @JsonProperty
  private var _details:HashMap<String, String> as Details
}
