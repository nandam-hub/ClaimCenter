package parametric.batch

uses com.fasterxml.jackson.databind.ObjectMapper
uses gw.api.properties.RuntimePropertyRetriever
uses gw.surepath.suite.integration.logging.StructuredLogger
uses gw.processes.BatchProcessBase
uses org.apache.http.client.methods.HttpGet
uses org.apache.http.impl.client.HttpClients
uses org.apache.http.util.EntityUtils
uses parametric.batch.dto.WeatherInfoDTO

class ParametricInsuranceBatch extends BatchProcessBase {
  private var _parametricPropertyRetriever = new RuntimePropertyRetriever(RuntimePropertyGroup.TC_PARAMETRICINSURANCE)
  private var _policySearchPropertyRetriever = new RuntimePropertyRetriever(RuntimePropertyGroup.TC_POLICYSEARCH)
  private static var _log = StructuredLogger.INTEGRATION

  var client = HttpClients.createDefault()
  var _mapper = new ObjectMapper()

  construct() {super(BatchProcessType.TC_PARAMETRICINSURANCE)}

  protected override function doWork() {

    // First Fetch weather info from NOAA Mock service
    var baseUrl = _parametricPropertyRetriever.getStringProperty("Parametric_Insurance_Base_URL")
    var endpoint= _parametricPropertyRetriever.getStringProperty("Parametric_Insurance_Endpoint")
    var request = new HttpGet(baseUrl+endpoint)
    var response  = client.execute(request)
    var entity = response.getEntity()
    var responseString = EntityUtils.toString(entity, "UTF-8")
    var res = _mapper.readValue(responseString, WeatherInfoDTO)
    var zipcodes = res.weatherInfoList*.zipcode
    if(response.StatusLine.StatusCode == 200){
      _log.info("WeatherInfo successfully fetched")
    } else {
      _log.info("Issue in fetching weatherinfo"+ response.StatusLine.StatusCode)
    }
  }
}