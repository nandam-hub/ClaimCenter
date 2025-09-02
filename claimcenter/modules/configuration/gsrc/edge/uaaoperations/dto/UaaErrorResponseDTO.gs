package edge.uaaoperations.dto

uses edge.jsonmapper.JsonProperty

class UaaErrorResponseDTO {
  @JsonProperty
  private var uaaError: String as error

  @JsonProperty
  private var uaaErrorDescription: String as error_description
}
