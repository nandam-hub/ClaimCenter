package edge.servlet.jsonrpc.marshalling

uses com.fasterxml.jackson.databind.BeanDescription
uses com.fasterxml.jackson.databind.SerializationConfig
uses com.fasterxml.jackson.databind.ser.BeanPropertyWriter
uses com.fasterxml.jackson.databind.ser.BeanSerializerModifier
uses com.fasterxml.jackson.databind.JsonSerializer
uses com.fasterxml.jackson.databind.ser.std.BeanSerializerBase
uses edge.jsonmapper.JsonProperty
uses edge.masking.annotation.Masked
uses gw.lang.reflect.TypeSystem

/**
 * {@BeanSerializerModifier} used by {@link GosuModule}. Adjusts property detection made by Jackson on Java Beans to
 * better fit Gosu objects:
 *   - Removes properties declared by {@link IGosuObject}, mainly to avoid trying to serialize
 *     type information accessed through {@code .Type}.
 *   - Removes private fields being discovered by Jackson
 */
internal class GosuBeanSerializerModifier extends BeanSerializerModifier {

  override function changeProperties(
      config: SerializationConfig,
      beanDesc: BeanDescription,
      beanProperties: List<BeanPropertyWriter>
  ): List<BeanPropertyWriter> {

    var gosuTypeInfo = TypeSystem.getByFullNameIfValid(beanDesc.BeanClass.Name).TypeInfo
    var propsToSerialize = new ArrayList<BeanPropertyWriter>()

    for (prop in beanProperties) {
      var gosuProp = GosuUtils.findGosuPropertyFor(gosuTypeInfo, prop.Member)
      if (gosuProp != null && !GosuUtils.isPropertyDeclaredByIGosuObject(gosuProp)) {
        if (gosuProp?.hasAnnotation(Masked.Type)) {
          var pattern = (gosuProp.getAnnotation(Masked.Type).Instance as Masked).pattern()
          propsToSerialize.add(new GosuBeanMaskedPropertyWriter(prop, pattern))
        } else {
          propsToSerialize.add(prop)
        }
      }
    }

    return propsToSerialize
  }

  override function modifySerializer(config: SerializationConfig, beanDesc: BeanDescription, serializer: JsonSerializer): JsonSerializer {
    if (serializer typeis BeanSerializerBase) {
      var gosuType = TypeSystem.getByFullNameIfValid(beanDesc.BeanClass.Name)
      var gosuTypeInfo = gosuType.TypeInfo
      var enhancementProps = gosuTypeInfo.Properties.where(\prop ->
        prop.hasAnnotation(JsonProperty.Type) && !prop.OwnersType.isAssignableFrom(gosuType)
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
