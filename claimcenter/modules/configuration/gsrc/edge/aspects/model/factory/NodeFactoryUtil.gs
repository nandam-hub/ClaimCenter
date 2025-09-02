package edge.aspects.model.factory

uses edge.aspects.ancestors.AncestorChain
uses edge.aspects.model.ModelNode
uses edge.aspects.model.AtomicValueNode
uses edge.aspects.model.ArrayNode
uses edge.aspects.model.StringMapNode
uses gw.lang.reflect.IPropertyInfo
uses gw.util.Pair
uses edge.aspects.model.DtoNode
uses gw.lang.reflect.IType
uses edge.metadata.service.IMetadataService

/** Node factory utilities. */
public final class NodeFactoryUtil {

  /** Creates a factory for the atomic value (value with no internal structure). */
  public static reified function forAtomic<C, T>(aspect : IAspectFactory<C, T>) : INodeFactory<C, T> {
    return new INodeFactory<C, T>() {
      override function createNode(ctx : C, ancestors: AncestorChain<ModelNode<T>>, value: Object): ModelNode<T> {
        return new AtomicValueNode<T>(ancestors, value, \n -> aspect.createAspectFor(ctx, n))
      }
    }
  }

  /** Creates a factory for an array type using an aspect factory and factory for the child element. */
  public static reified function forArray<C, T>(aspect : IAspectFactory<C, T>, eltFactory : INodeFactory<C, T>) : INodeFactory<C, T> {
    return new INodeFactory<C, T>() {
      override function createNode(ctx : C, ancestors: AncestorChain<ModelNode<T>>, value: Object): ModelNode<T> {
        return new ArrayNode<C, T>(ctx, ancestors, value, \n -> aspect.createAspectFor(ctx, n), eltFactory)
      }
    }
  }


  /** Creates a factory for a Map<String, Object> type using an aspect factory and factory for the child element. */
  public static reified function forStringMap<C, T>(aspect : IAspectFactory<C, T>, eltFactory : INodeFactory<C, T>) : INodeFactory<C, T> {
    return new INodeFactory<C, T>() {
      override function createNode(ctx : C, ancestors: AncestorChain<ModelNode<T>>, value: Object): ModelNode<T> {
        return new StringMapNode<C, T>(ctx, ancestors, value, \n -> aspect.createAspectFor(ctx, n), eltFactory)
      }
    }
  }


  /** Creates a factory for a Map<String, Object> type using an aspect factory and factory for the child element. */
  public static reified function forDto<C, T>(aspect : IAspectFactory<C, T>, props : List<Pair<IPropertyInfo, INodeFactory<C, T>>>) : INodeFactory<C, T> {
    return new INodeFactory<C, T>() {
      override function createNode(ctx : C, ancestors: AncestorChain<ModelNode<T>>, value: Object): ModelNode<T> {
        return new DtoNode<C, T>(ctx, ancestors, value, \n -> aspect.createAspectFor(ctx, n), props)
      }
    }
  }

  /** Creates a new node factory ready to build complete trees of object.s */
  public static reified function createTreeFactory<C, T>(ctx : C, type : IType, aspects:  IAspectPrecompiler<C, T>, meta : IMetadataService) : INodeFactory<C, T> {
    return new NodeFactoryBuilder<C, T>(aspects, meta).createNodeFactory(type, aspects.forCollectionElement(type))
  }
}
