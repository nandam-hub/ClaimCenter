package edge.journey

uses java.util.HashMap
uses org.json.simple.parser.JSONParser
uses java.io.FileReader
uses java.lang.Exception
uses org.json.simple.JSONArray
uses java.util.ArrayList
uses java.util.Map
uses java.util.List
uses com.fasterxml.jackson.databind.ObjectMapper
uses java.util.LinkedHashMap
uses edge.di.annotations.ForAllGwNodes

class DefaultSampleTimelineGeneratorPlugin implements ISampleTimelineGenerator {

  @ForAllGwNodes
  construct() {}

  override function getSampleTimeline(): HashMap<String, List<HashMap<Object, Object>>> {
    var timeline = new HashMap<String, List<HashMap>>()
    timeline.put('events', readSampleData())
    return timeline
  }

  private function readSampleData() : List<HashMap> {
    var jsonParser = new JSONParser()
    var sampleJSONData = jsonParser.parse(new FileReader(gw.api.util.ConfigAccess.getConfigFile("gsrc/edge/journey/data/SampleData.json")))
    var dataList = new ArrayList<HashMap>();
    (sampleJSONData as JSONArray).each(\element -> {
      dataList.add(convertLinkedHashMapToHashMap(new ObjectMapper().readValue(element as String, HashMap<String, Object>)))
    })
    return dataList
  }

  private function convertLinkedHashMapToHashMap(event : HashMap) : HashMap {
    event.eachKeyAndValue( \ eventKey, eventValue -> {
      if(eventValue typeis LinkedHashMap) {
        var newHashMap = new HashMap<String, String>()
        eventValue.eachKeyAndValue( \ linkedHashMapKey, linkedHashMapValue -> {
          newHashMap.put(linkedHashMapKey as String, linkedHashMapValue as String)
        })
        event.put(eventKey, newHashMap)
      }
    })
    return event
  }
}
