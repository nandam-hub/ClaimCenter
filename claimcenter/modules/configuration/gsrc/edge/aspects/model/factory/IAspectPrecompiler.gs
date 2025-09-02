package edge.aspects.model.factory

uses gw.lang.reflect.IType
uses gw.lang.reflect.IPropertyInfo

/**
 * Aspect builder used to prepare aspect factory and increase speed of model generation. Aspect precompiler could access
 * model-related data and create properly configured factories. For example, aspect could compile expressions defined
 * on the property or type using expression compiler. In this case compilation would happen only once, when aspect
 * is prepared. This would help to increase throughput (as no interpretation happens during runtime) and correctness
 * (as invalid aspect configuration could be detected during the preparation time, which usually happens during the
 * application startup).
 *
 * @param C type of the external context.
 * @param T type of the aspect.
 */
interface IAspectPrecompiler<C, T> {

  /** Creates a new aspect factory for the element with specific type in a collection. This method is used to create
   * elements of both arrays and maps. This function does not have any additional information as root/property
   * annotations belongs to the collection node itself, not an element node.
   */
  public function forCollectionElement(nodeType : IType) : IAspectFactory<C, T>


  /**
   * Creates a new aspect factory for the "property value" element. In other words, this aspect factory creates an
   * aspect for the destination of "property" step in the dto. This factory is used to generate values of DTO
   * properties.
   */
  public function forProperty(prop : IPropertyInfo) : IAspectFactory<C, T>
}
