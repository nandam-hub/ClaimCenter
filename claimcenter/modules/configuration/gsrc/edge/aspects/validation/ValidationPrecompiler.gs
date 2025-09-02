package edge.aspects.validation

uses edge.aspects.model.factory.IAspectFactory
uses gw.lang.reflect.IPropertyInfo
uses gw.lang.reflect.IType
uses edge.metadata.service.IMetadataService
uses edge.aspects.validation.requiredness.RequirednessPrecompiler
uses edge.aspects.validation.validity.ValidityRulePrecompiler
uses edge.aspects.validation.augment.AugmentPrecompiler
uses edge.aspects.validation.context.ContextPrecompiler
uses edge.PlatformSupport.Reflection
uses edge.metadata.service.IElementMetadata
uses edge.aspects.validation.context.ContextAspect
uses edge.metadata.service.ElementMetadataUtil
uses java.util.Collections
uses java.lang.IllegalArgumentException
uses edge.aspects.model.factory.IAspectPrecompiler

/** Precompiler for the validation aspects. */
final class ValidationPrecompiler implements IAspectPrecompiler<ContextAspect, ValidationAspect> {
  /** Service used to extract type metadata. */
  private var _metaService : IMetadataService

  private construct(ms : IMetadataService) {
    this._metaService = ms
  }



  override function forCollectionElement(nodeType: IType): IAspectFactory<ContextAspect, ValidationAspect> {
    return createForMetadata(_metaService.getTypeMetadata(nodeType), nodeType, Object, Collections.emptyList(), "")
  }

  override function forProperty(prop: IPropertyInfo): IAspectFactory<ContextAspect, ValidationAspect> {
    final var meta = ElementMetadataUtil.getJointMetadata(_metaService, prop)
    return createForMetadata(meta, Reflection.getPropertyType(prop), prop.OwnersType,
        Reflection.getAnnotations(prop), prop.Name)
  }


  /** Creates a new validation aspect based on the node metadata.
   * @param metadata metadata defining rules to apply.
   * @param nodeType type of the node's value.
   * @param parentType type of the node's parent (DTO object).
   * @param legacyAnnots list of annotations to use in the metadata generation process.
   * @param legacyProperty property name to pass to the legacy validators.
   */
  private function createForMetadata(
        metadata : IElementMetadata,
        nodeType : IType,
        parentType : IType,
        legacyAnnots : List<IAnnotation>,
        legacyProperty : String)
      : IAspectFactory<ContextAspect, ValidationAspect> {
    final var contextTypes = new IType[] {nodeType, parentType}
    final var expTypes = new IType[] {nodeType, parentType, ContextAspect}
    final var requiredness = AugmentPrecompiler.fromMetadata(metadata, expTypes,
        \path, meta ->
            RequirednessPrecompiler.fromMetadata(meta, resolveArgTypes(path, nodeType, parentType)))
    var validity = AugmentPrecompiler.fromMetadata(metadata, expTypes,
        \path, meta ->
            ValidityRulePrecompiler.fromMetadata(meta, resolveArgTypes(path, nodeType, parentType)))

    return new ValidationAspectFactory (
        requiredness, validity,
        ContextPrecompiler.fromMetadata(metadata, contextTypes))
  }


  /** Resolves argument types for the given path. */
  private function resolveArgTypes(path : String, nodeType : IType, parentType : IType) : IType[] {
    if (path == null) {
      return new IType[] { nodeType, parentType, ContextAspect}
    }
    final var pathElements = path.split("\\.")
    for (var step in pathElements) {
      final var nextProp = _metaService.getExposedProperties(nodeType).firstWhere( \ elt -> elt.Name == step)
      if (nextProp == null) {
        throw new IllegalArgumentException("Path " + path + " references nonexistent property " + step + " on " + nodeType)
      }
      parentType = nodeType
      nodeType = Reflection.getPropertyType(nextProp)
    }
    return new IType[] { nodeType, parentType, ContextAspect}
  }

  /** Creates a new validation precompiler. */
  public static function make(ms : IMetadataService) : ValidationPrecompiler {
    return new ValidationPrecompiler(ms)
  }
}
