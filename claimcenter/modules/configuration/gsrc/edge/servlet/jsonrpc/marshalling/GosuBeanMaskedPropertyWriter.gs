package edge.servlet.jsonrpc.marshalling

uses com.fasterxml.jackson.core.JsonGenerator
uses com.fasterxml.jackson.databind.SerializerProvider
uses com.fasterxml.jackson.databind.ser.BeanPropertyWriter

class GosuBeanMaskedPropertyWriter extends BeanPropertyWriter {

  private static final var FRONTEND_MOCK_VALUE : String = "0streamlinedquote0"
  var _pattern : String

  construct(writer : BeanPropertyWriter) {
      super(writer)
  }

  construct(writer: BeanPropertyWriter, pattern: String) {
    super(writer)
    _pattern = pattern
  }

  override function serializeAsField(bean : Object, gen: JsonGenerator, provider: SerializerProvider) {
    var beanValue = this._accessorMethod.invoke(bean) as String
    gen.writeStringField(this.getName(), ((beanValue == null) || (beanValue == FRONTEND_MOCK_VALUE)) ? beanValue : _pattern)
  }
}
