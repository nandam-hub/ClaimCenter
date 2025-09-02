package edge.servlet.jsonrpc.marshalling

uses com.fasterxml.jackson.databind.BeanDescription
uses com.fasterxml.jackson.databind.JsonSerializer
uses com.fasterxml.jackson.databind.SerializationConfig
uses com.fasterxml.jackson.databind.ser.BeanPropertyWriter
uses com.fasterxml.jackson.databind.ser.BeanSerializerModifier
uses com.fasterxml.jackson.databind.ser.std.BeanSerializerBase
uses edge.aspects.validation.annotations.ObservableJsonProperty
uses edge.jsonmapper.JsonProperty
uses gw.lang.reflect.TypeSystem

/**
 * {@BeanSerializerModifier} used by {@link edge.servlet.jsonrpc.marshalling.GosuObservabilityModule}. Extends functionality of GosuBeanSerializerModifer to add the following constraint:
 *   - Removes fields that do not implement the ObservableField annotation in Edge
 */
internal class GosuBeanObservabilitySerializerModifier extends BeanSerializerModifier {
  override function changeProperties(
      config: SerializationConfig,
      beanDesc: BeanDescription,
      beanProperties: List<BeanPropertyWriter>
  ): List<BeanPropertyWriter> {
    var gosuTypeInfo = TypeSystem.getByFullNameIfValid(beanDesc.BeanClass.Name).TypeInfo
    return beanProperties.where(\prop -> {
      var gosuProp = GosuUtils.findGosuPropertyFor(gosuTypeInfo, prop.Member)
      return gosuProp != null && !GosuUtils.isPropertyDeclaredByIGosuObject(gosuProp) && GosuUtils.isPropertyObservable(gosuProp)
    })
  }

  override function modifySerializer(config: SerializationConfig, beanDesc: BeanDescription, serializer: JsonSerializer): JsonSerializer {
    if (serializer typeis BeanSerializerBase) {
      var gosuType = TypeSystem.getByFullNameIfValid(beanDesc.BeanClass.Name)
      var gosuTypeInfo = gosuType.TypeInfo
      var enhancementProps = gosuTypeInfo.Properties.where(\prop ->
          prop.hasAnnotation(JsonProperty.Type) && prop.hasAnnotation(ObservableJsonProperty.Type) && !prop.OwnersType.isAssignableFrom(gosuType)
      )
      if ( !enhancementProps.Empty ) {
        return new EnhancedClassSerializer(serializer, enhancementProps)
      }
    }
    return serializer
  }

  private enum GosuPropSource {
    FIELD, GETTER }
}
