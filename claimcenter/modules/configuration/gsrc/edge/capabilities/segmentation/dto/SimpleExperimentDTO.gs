package edge.capabilities.segmentation.dto

uses edge.jsonmapper.JsonProperty
uses java.lang.Integer

/**
 * Response for the simple A/B-like experiment.
 */
class SimpleExperimentDTO {
  /**
   * Representation of the experiment variation.
   */
  @JsonProperty
  private var _experimentResponse: Integer as ExperimentResponse
  /**
   * Representation of the experiment ID.
   */
  @JsonProperty
  private var _experimentId: String as ExperimentId
}
