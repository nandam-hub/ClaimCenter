package edge.journey

uses java.util.List
uses java.util.HashMap

/**
 * Plugin used for sample timeline generation
 */
interface ISampleTimelineGenerator {

  /**
   * Reads a sample json file and return a Hashmap of sample timeline data
   */
  function getSampleTimeline() : HashMap<String, List<HashMap>>
}
