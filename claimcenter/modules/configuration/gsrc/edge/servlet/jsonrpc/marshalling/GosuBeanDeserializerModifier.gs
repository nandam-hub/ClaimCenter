package edge.servlet.jsonrpc.marshalling

uses com.fasterxml.jackson.databind.BeanDescription
uses com.fasterxml.jackson.databind.DeserializationConfig
uses com.fasterxml.jackson.databind.annotation.JsonDeserialize
uses com.fasterxml.jackson.databind.deser.BeanDeserializerModifier
uses com.fasterxml.jackson.databind.introspect.BeanPropertyDefinition
uses java.util.Map
uses java.util.TreeMap
uses java.lang.Class
uses java.util.Set
uses java.lang.reflect.Array
uses edge.jackson.support.JsonDeserializeBuilder
uses gw.lang.reflect.IType
uses gw.lang.reflect.TypeSystem

/**
 * <p>A BeanDeserializerModifier allowing Jackson deserialization of JSON objects into POGOs.</p>
 * <p>This deserializer modifies solves the following issues with POGO serialization:</p>
 * <ul>
 *   <li>Prevents deserialization of properties defined in {@code IGosuObject} (including type
 *   information)</li>
 *   <li>Prevents deserialization of private vars, visible to Jackson by default</li>
 *   <li>Allows collection deserialization, prevented by Gosu as it blocks Jackson's access to Java
 *   type information ({@link java.lang.reflect.Type})
 * </ul>
 *
 */
internal class GosuBeanDeserializerModifier extends BeanDeserializerModifier {
  override function updateProperties(
      config: DeserializationConfig,
      beanDesc: BeanDescription,
      propDefs: List<BeanPropertyDefinition>
  ): List<BeanPropertyDefinition> {
    var beanType = TypeSystem.getByFullNameIfValid(beanDesc.BeanClass.Name)

    return propDefs
        .where(\prop -> {
          var gosuProp = GosuUtils.findGosuPropertyFor(beanType.TypeInfo, prop.Accessor)
          return gosuProp != null && !GosuUtils.isPropertyDeclaredByIGosuObject(gosuProp)
          && !GosuUtils.isPropertyJsonReadOnlyProperty(gosuProp)
        })
        .map(\prop -> {
          var jsonDeserializeAnnotation = findAnnotation(prop, beanType)

          if (jsonDeserializeAnnotation != null) {
            prop.Mutator.AllAnnotations.addIfNotPresent(jsonDeserializeAnnotation)
          }

          return prop
        })
  }

  /** Attempt to find the right list/collection deserializer annotation for a given type.
   *  This is Gosu 'telling' Jackson which classes to use to attempt to deserialize the type but also the value deserializer.
   */
  private function findAnnotation(gosuProp : BeanPropertyDefinition, beanType : IType) : JsonDeserialize {
    var gosuName = gosuProp.InternalName.substring(0, 1).toUpperCase() + gosuProp.InternalName.substring(1)
    var gosuFeatureType = beanType.TypeInfo.Properties.firstWhere(\p -> p.Name == gosuName).FeatureType

    if (List.Type.isAssignableFrom(gosuFeatureType)) {
      return JsonDeserializeBuilder.generateList(gosuFeatureType.TypeParameters[0] as Type as Class)
    } else if (TreeMap.Type.isAssignableFrom(gosuFeatureType)) {
      return JsonDeserializeBuilder.generateTreeMap(gosuFeatureType.TypeParameters[1] as Type as Class)
    }else if (Set.Type.isAssignableFrom(gosuFeatureType)) {
      return JsonDeserializeBuilder.generateSet(gosuFeatureType.TypeParameters[0] as Type as Class)
    } else if (Map.Type.isAssignableFrom(gosuFeatureType)) {
      var typeParam = gosuFeatureType.TypeParameters[1]
      if (Array.Type.isAssignableFrom(typeParam)) {
        return JsonDeserializeBuilder.generateMap(typeParam as Type as Class, new MapValueArrayDeserializer())
      } else {
        return JsonDeserializeBuilder.generateMap(typeParam as Type as Class)
      }
    }

    return null
  }
}
