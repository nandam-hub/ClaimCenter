package edge.capabilities.segmentation

uses edge.jsonrpc.AbstractRpcHandler
uses edge.capabilities.segmentation.dto.SimpleExperimentDTO
uses edge.doc.ApidocAvailableSince
uses edge.doc.ApidocMethodDescription
uses edge.di.annotations.InjectableNode
uses edge.jsonrpc.annotation.JsonRpcUnauthenticatedMethod
uses java.util.Random
uses java.lang.Integer
uses java.util.Map

/**
 * Demo handler to emulate A/B-like experiment API.
 */
class DemoExperimentHandler extends AbstractRpcHandler {
  @InjectableNode
  construct() {
  }

  @JsonRpcUnauthenticatedMethod
  @ApidocMethodDescription("Get the experiment value for the A/B like experiment.")
  @ApidocAvailableSince("6.0")
  function getExperimentValue(experimentId: String, params : Map<String, String>): SimpleExperimentDTO {
    final var res = new SimpleExperimentDTO()

    res.ExperimentResponse = getIntInRange(0, 1)
    res.ExperimentId = experimentId

    return res
  }

  /**
   * Gives a random number in the range
   */
  public static function getIntInRange(min: Integer, max: Integer): Integer {
    var rand = new Random()

    return rand.nextInt((max - min) + 1) + min
  }
}
