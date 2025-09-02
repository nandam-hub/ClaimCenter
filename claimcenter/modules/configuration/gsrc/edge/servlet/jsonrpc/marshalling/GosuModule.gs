package edge.servlet.jsonrpc.marshalling

uses com.fasterxml.jackson.databind.module.SimpleDeserializers
uses edge.jackson.support.GosuSimpleModuleBase
uses com.fasterxml.jackson.databind.deser.DeserializationProblemHandler
uses com.fasterxml.jackson.databind.JsonDeserializer
uses com.fasterxml.jackson.core.JsonParser
uses com.fasterxml.jackson.databind.DeserializationContext
uses edge.jsonmapper.JsonReadOnlyProperty
uses edge.di.boot.Bootstrap
uses java.util.ArrayList
uses edge.PlatformSupport.Reflection
uses edge.PlatformSupport.Logger
uses gw.lang.reflect.TypeSystem

/**
 * Jackson module to be used to serialize/deserialize Gosu objects.
 */
class GosuModule extends GosuSimpleModuleBase {

  final private static var LOGGER = new Logger(Reflection.getRelativeName(GosuModule))

  /**
   * Deserialization problem handler used to deserializer properties defined by enhancements
   */
  static class EnhancementHandler extends DeserializationProblemHandler {
    override function handleUnknownProperty(ctxt: DeserializationContext, jp: JsonParser, deserializer: JsonDeserializer< Object >, beanOrClass: Object, propertyName: String): boolean {
      if ( beanOrClass typeis Class || !propertyName.HasContent) {
        return false
      } else {
        var beanType = typeof beanOrClass
        var propName = propertyName.substring(0, 1).toUpperCase() + propertyName.substring(1)
        var propInfo = beanType.TypeInfo.getProperty(propName)
        if (propInfo != null && propInfo.Writable && !propInfo.Annotations.hasMatch(\annot -> annot.Type == JsonReadOnlyProperty)) {
            var v = ctxt.readValue(jp, propInfo.FeatureType as Type as Class)
            propInfo.Accessor.setValue(beanOrClass, v)
            return true
          } else {
            return false
          }
        }
    }
  }

  static var _instance = new GosuModule()

  static property get INSTANCE(): GosuModule {
    return _instance
  }

  protected construct() {
    super.setSerializerModifier(new GosuBeanSerializerModifier())
    super.addSerializer(new TypeKeySerializer())

    addDeserializersFromDI()
    super.setDeserializerModifier(new GosuBeanDeserializerModifier())
    super.setValueInstantiators(new GosuValueInstantiators())
  }

  private function addDeserializersFromDI(){
    var deserializers = getDeserializersFromDI()
    for (type in deserializers.keySet()){
      var deserializer = deserializers.get(type)
      super.addDeserializer(type, deserializer)
    }
  }


  function resetDeserializers(){
    var desers = new SimpleDeserializers(getDeserializersFromDI())
    setDeserializers(desers)
  }

  private function getDeserializersFromDI() : HashMap<Class, JsonDeserializer>{
    var deserializersFromDI = new HashMap<Class, JsonDeserializer>()
    var dependencyContainer = Bootstrap.getStatus()
    if (dependencyContainer.isRight){
      var container = dependencyContainer.right
      var badDeserializerConfigs = new ArrayList<String>()

      for (deserializerPath in container.ConfigurationKeys.where( \ key -> key.Path.Length == 2 && "deserializers".equals(key.Path.Parent.Name))) {
        final var requestPath = "${deserializerPath.Path.Name}"
        final var deserializer = container.createNode(deserializerPath, JsonDeserializer)
        if (deserializer.isRight) {
          var type = TypeSystem.getByFullNameIfValid(requestPath) as Type as Class
          deserializersFromDI.put(type, deserializer.right as JsonDeserializer)
          super.addDeserializer(type, deserializer.right as JsonDeserializer)
        } else {
          for (err in deserializer.left) {
            badDeserializerConfigs.add("Could not create instance of deserializer at " + deserializerPath + " : " + err)
          }
        }
      }
      if (!badDeserializerConfigs.Empty) {
        LOGGER.logError("======  FATAL DESERIALIZER CONFIGURATION ISSUES FOUND =========")
        badDeserializerConfigs.each( \ elt -> LOGGER.logError(elt))
      }
    } else {
      for (err in dependencyContainer.left) {
        LOGGER.logError("EDGE STARTUP ERROR: " + err)
      }
    }

    return deserializersFromDI
  }

  override function doSetupModule(context: SetupContext) {
    context.addDeserializationProblemHandler(new EnhancementHandler())
  }
}
