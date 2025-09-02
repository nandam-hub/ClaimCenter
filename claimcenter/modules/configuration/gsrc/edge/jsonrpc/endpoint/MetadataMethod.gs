package edge.jsonrpc.endpoint

uses java.util.Collection
uses gw.lang.reflect.IType
uses edge.webapimodel.dto.WebApiModelDTO
uses java.util.Set
uses java.util.HashSet
uses gw.lang.reflect.gs.IGosuClass
uses java.lang.Iterable
uses gw.lang.reflect.IMethodInfo
uses java.util.Collections
uses gw.entity.ITypeList

/**
 * Automatically generated metadata method.
 */
internal final class MetadataMethod extends InvokableMethod {
  /**
   * Types referenced by the RPC methods. Used for metadata generation. Metadata could be locale-specific so only
   * types are cached and not generated result.
   */
  private var _refTypes : Collection<IType>

  construct(referencedTypes : Collection<IType>) {
    this._refTypes = referencedTypes
  }


  override function invoke(args : List<Object>) : Object {
    final var res = new WebApiModelDTO()
    _refTypes.each(\ t -> res.registerType(t))
    return res
  }


  internal static function create(rpcMethods: Iterable<IMethodInfo>) : IEndpointMethod {
    final var res = new HashSet<IType>()

    for (var meth in rpcMethods) {
      aggTypes(res, meth.ReturnType)
      meth.Parameters.each(\ i -> aggTypes(res, i.Type))
    }

    return new MetadataMethod(res)
  }


  /**
   * Aggregates referenced types into the accumulator.
   */
  private static function aggTypes(acc: Set<IType>, type: IType) {

    while (type.Array) {
      type = type.ComponentType
    }

    if (acc.contains(type)) {
      return
    }

    if (type typeis ITypeList) {
      acc.add(type)
    } else {
      if (!(type typeis IGosuClass)) {
        return
      }

      acc.add(type)
      for (var prop in type.TypeInfo.Properties) {
        aggTypes(acc, prop.Type)
      }
    }
  }

  override function getArgumentTypes(): List<IType> {
    return Collections.emptyList()
  }

  override function getMethodInfo() : IMethodInfo {
    return null
  }
}
