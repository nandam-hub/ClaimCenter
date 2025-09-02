package edge.jsonrpc.endpoint.validation

uses edge.aspects.validation.ValidationPrecompiler
uses edge.metadata.typeinfo.type.TypeAnalyzer
uses gw.lang.reflect.IParameterInfo
uses java.util.Collections
uses edge.aspects.model.factory.NodeFactoryUtil
uses edge.metadata.service.IMetadataService
uses edge.metadata.service.DefaultMetadataService
uses edge.aspects.validation.context.ContextAspect

/** Factory used for the validation arguments. */
final class ArgumentValidatorFactory {

  /** Default instance for the factory. Use it until DI is available for the framework configuration. */
  public static final var INSTANCE : ArgumentValidatorFactory = new ArgumentValidatorFactory(DefaultMetadataService.SERVICE)

  /** No validation for the node. */
  private static final var NO_VALIDATION = new ArgumentValidator() {
    override function validate(ctx : ContextAspect, value: Object): List<ArgumentValidationError> {
      return Collections.emptyList()
    }
  }

  /** Precompiler for the validaton. */
  private var _validationPrecompiler : ValidationPrecompiler

  /** Metadata service for this factory. */
  private var _meta : IMetadataService


  private construct(ms : IMetadataService) {
    this._meta = ms
    this._validationPrecompiler = ValidationPrecompiler.make(ms)
  }


  public function createValidator(param : IParameterInfo) : ArgumentValidator {
    final var type = param.FeatureType
    final var kind = TypeAnalyzer.encodeType(type).First.Kind

    /* We do not support primitive validation yet. */
    if (kind == "primitive") {
      return NO_VALIDATION
    }

    final var validationFactory = NodeFactoryUtil.createTreeFactory(null, type, _validationPrecompiler, _meta)
    return new BaseArgumentValidator(param.Name, validationFactory)
  }
}
