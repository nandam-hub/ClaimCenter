package edge.di

uses com.fasterxml.jackson.databind.MapperFeature
uses com.fasterxml.jackson.databind.SerializationFeature
uses edge.PlatformSupport.Logger
uses edge.PlatformSupport.Reflection
uses edge.servlet.jsonrpc.protocol.ObjectMapperFactory
uses edge.util.properties.EdgePropertiesConstants
uses gw.api.server.Availability
uses gw.api.server.AvailabilityLevel
uses gw.api.startable.IStartablePlugin
uses gw.api.startable.StartablePluginCallbackHandler
uses gw.api.startable.StartablePluginState
uses gw.api.util.ConfigAccess
uses gw.pl.util.FileUtil

uses java.io.File
uses java.io.FileOutputStream

/**
 * Generates a file with edge metadata for each of the edge endpoints available
 */
@Distributed
@Availability(AvailabilityLevel.MULTIUSER)
class EdgeAPIMetadataPlugin implements IStartablePlugin {

  final private static var _logger = new Logger(Reflection.getRelativeName(EdgeAPIMetadataPlugin))

  private var _state = StartablePluginState.Stopped

  private function writeToFile(object: Object) {
    var metadataFilePath = ConfigAccess.getConfigFile(EdgePropertiesConstants.EDGE_PROPERTIES_LOCATION).AbsolutePath+"/EdgeAPIMetadata.json"
    var file = new File(metadataFilePath);
    var fileOutputStream = new FileOutputStream(file);
    if (!file.exists()) {
      file.createNewFile();
    }
    FileUtil.makeWritable(file);
    final var objectMapper = ObjectMapperFactory.createObjectMapper()
    objectMapper.enable(SerializationFeature.INDENT_OUTPUT);
    objectMapper.writeValue(fileOutputStream, object);
  }

  function getLocaleMetadata(rpcHandler : Object) : Optional<Object> {
    var localeMethod = rpcHandler.Class.Methods.firstWhere(\ method -> method.Name.equals("getLocaleConfig"));
    if (localeMethod != null) {
      var localeMetadata = localeMethod.invoke(rpcHandler);
      return Optional.of(localeMetadata);
    }
    return Optional.empty();
  }

  override function start(p0: StartablePluginCallbackHandler, p1: boolean) {
    _state = StartablePluginState.Started
    final var jsonRpcHandlers = HandlerInfoLookup.Instance.JsonRpcHandlers
    _logger.logInfo("Generating edge API metadata for ${jsonRpcHandlers.size()} handlers.")

    var mappedMetadata = new HashMap<String, Object>();

    jsonRpcHandlers.entrySet().forEach(\entry -> {
      var rpcHandler = entry.getValue();
      var endpointName = entry.getKey();
      mappedMetadata.put(endpointName, rpcHandler.getMetaData());
      var maybeLocaleMetadata = getLocaleMetadata(rpcHandler);
      if (maybeLocaleMetadata.isPresent()) {
        _logger.logInfo("Locale handler method found on ${endpointName}, adding locale API metadata");
        mappedMetadata.put("${endpointName}/getLocaleConfig", maybeLocaleMetadata.get());
      }
    });
    writeToFile(mappedMetadata);
  }

  override function stop(p0: boolean) {
    _state = StartablePluginState.Stopped
  }

  override property get State(): StartablePluginState {
    return _state
  }
}
