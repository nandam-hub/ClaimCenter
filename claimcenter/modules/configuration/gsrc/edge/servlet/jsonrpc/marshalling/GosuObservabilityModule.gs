package edge.servlet.jsonrpc.marshalling

class GosuObservabilityModule extends GosuModule {

  static var _observability_instance = new GosuObservabilityModule()

  static property get OBSERVABILITY_INSTANCE(): GosuObservabilityModule {
    return _observability_instance
  }

  protected construct() {
    super.setSerializerModifier(new GosuBeanObservabilitySerializerModifier())
    super.addSerializer(new TypeKeySerializer())
  }
}
