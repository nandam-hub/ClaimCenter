package edge.servlet.jsonrpc.marshalling

uses com.fasterxml.jackson.databind.ser.std.BeanSerializerBase
uses gw.lang.reflect.IPropertyInfo
uses com.fasterxml.jackson.databind.ser.impl.ObjectIdWriter
uses com.fasterxml.jackson.databind.ser.impl.BeanAsArraySerializer
uses com.fasterxml.jackson.core.JsonGenerator
uses com.fasterxml.jackson.databind.SerializerProvider
uses com.fasterxml.jackson.databind.ser.BeanPropertyWriter

uses java.util.regex.Pattern
uses java.util.Set

internal class EnhancedClassSerializer extends BeanSerializerBase {
    var _enhancementProps:List<IPropertyInfo>
    static var propNameLowercasePortion: Pattern = Pattern.compile("\\p{javaLowerCase}+")

    construct(base: BeanSerializerBase, enhancementProps: List<IPropertyInfo>) {
      super(base)
      _enhancementProps = enhancementProps
    }

    construct(base: BeanSerializerBase,  enhancementProps: List<IPropertyInfo>, objectIdWriter:ObjectIdWriter) {
      super(base, objectIdWriter)
      _enhancementProps = enhancementProps
    }

    override function withObjectIdWriter(objectIdWriter: ObjectIdWriter): BeanSerializerBase {
      return new EnhancedClassSerializer(this, _enhancementProps, _objectIdWriter)
    }

    protected override function withIgnorals(set : Set<String>) : BeanSerializerBase {
      return new EnhancedClassSerializer(this, _enhancementProps)
    }

    override function withIgnorals(toIgnore: String[]): BeanSerializerBase {
      return new EnhancedClassSerializer(this, _enhancementProps)
    }

    override function asArraySerializer(): BeanSerializerBase {
      /* Can not:
       *
       * - have Object Id (may be allowed in future)
       * - have "any getter"
       * - have per-property filters
       */
      if ((_objectIdWriter == null)
          && (_anyGetterWriter == null)
          && (_propertyFilterId == null)
      ) {
        return new BeanAsArraySerializer(this);
      }
      // already is one, so:
      return this;
    }

    override function withFilterId(filterId: Object): BeanSerializerBase {
      return new EnhancedClassSerializer(this, _enhancementProps)
    }

    override function serialize(bean: Object, gen: JsonGenerator, provider: SerializerProvider) {
      gen.writeStartObject()
      serializeFields(bean, gen, provider)
      _enhancementProps.each( \ prop -> {
        var propName = serializedPropertyName(prop)
        var value = prop.Accessor.getValue(bean)
        if (value != null){ //Don't serialize empty values (ObjectMapper is set to not serialize nulls but this is explicit serialization)
          gen.writeFieldName(propName)
          provider.defaultSerializeValue(value, gen)
        }
      })
      gen.writeEndObject()
    }

  private function serializedPropertyName(prop: IPropertyInfo): String {
    var propName = prop.Name?:""
    var matcher = propNameLowercasePortion.matcher(propName);
    if(matcher.find()) {
      // PROropertyName -> propertyName
      var keepCaseFrom = matcher.start();
      return propName.substring(0, keepCaseFrom).toLowerCase() + propName.substring(keepCaseFrom)
    } else {
      // no lowercase found: PROPERTY -> property
      return propName.toLowerCase()
    }
  }

  protected override function withProperties(beanPropertyWriters : BeanPropertyWriter[], beanPropertyWriters1 : BeanPropertyWriter[]) : BeanSerializerBase {
    return new EnhancedClassSerializer(this, _enhancementProps)
  }

  protected override function withByNameInclusion(set : Set<String>, set1 : Set<String>) : BeanSerializerBase {
    return new EnhancedClassSerializer(this, _enhancementProps)
  }
}
