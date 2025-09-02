package edge.util.mapping

uses edge.security.authorization.IAuthorizerProviderPlugin

class Mapper {
  var _authzProvider : IAuthorizerProviderPlugin

  construct(authzProvider:IAuthorizerProviderPlugin) {
    _authzProvider = authzProvider
  }

  reified function mapRef<E,DTO>(entity:E, mapper(e:E):DTO):DTO {
    var authz = _authzProvider.authorizerFor(E)
    var dtoResult : DTO = null
    if ( entity == null || !authz.canAccess(entity)) {
      dtoResult = null
    } else {
      dtoResult = mapper(entity)
    }
    return dtoResult
  }

  reified function mapArray<E,DTO>(entities:E[],mapper(e:E):DTO):DTO[] {
    if (entities == null) {
      return {}
    }
    var authz = _authzProvider.authorizerFor(E)
    return entities.where(\ e -> authz.canAccess(e)).map( \ e -> mapper(e))
  }

  reified function hasAccess<E>(entity:E):boolean {
    return _authzProvider.authorizerFor(E).canAccess(entity)
  }
}
