package edge.util.mapping

uses edge.security.authorization.IAuthorizerProviderPlugin
uses java.lang.IllegalStateException
uses edge.security.authorization.Authorizer

abstract class UpdaterBase<C,E,DTO> {
  private var _authorizer : Authorizer<E>
  private var _creationContextProvider: EntityCreationContextProvider
  private var _dtoKey: block(dto: DTO): Object
  private var _entityKey: block(dto: E): Object
  private var _tempKey : block(dto : DTO) : String

  construct(authzProvider: IAuthorizerProviderPlugin) {
    _authorizer = getAuthorizer<E>(authzProvider)
    _creationContextProvider = new EntityCreationContextProvider()

    /* Initialize property accessors here. Users could change defaults later by using setters for these properties.
     * This initialization increases startup time a little bit, but this time is taken only once. Another approach is
     * to provide good lazy initialization, but it have to be done in a thread-safe way. Any thread-safe lazy
     * initialization have its runtime cost (however, negligible).
     *
     * In any way, there is no much difference in performance. But "initial values" are a bit easier to implement
     * right even if developers do not know or care about thread safety.
     */
    _dtoKey = getPropertyAccessor<DTO>("PublicID")
    _entityKey = getPropertyAccessor<E>("PublicID")

    /* Temp ID is not injectable now, but this could change in future. */
    final var tempIdProperty = DTO.Type.TypeInfo.getProperty("TempID")
    if (tempIdProperty == null) {
      _tempKey = \dto : DTO -> null
    } else {
      final var tempIdAccessor = tempIdProperty.Accessor
      _tempKey = \dto : DTO -> tempIdAccessor.getValue(dto) as String
    }
  }

  /**
   * A block returning the entities that can be assigned to the updated array/reference.
   * For array updates:
   *   - the value returned by this block only is used when trying to add an existing entity to the array.
   *   - a <code>null</code> block means that no existing item can be added into the array
   * For reference updates:
   *   - this block is used to find the entity matching the DTO (when <code>DtoKey(dto) != null</code>
   *   - a <code>null</code> block means that only new entities can be assigned to the reference
   */
  var _allowedValues(c:C):E[] as AllowedValues

  /**
   * A block used to retrieve the ID for a DTO. It defaults to a block returning the value of the <code>PublicID</code>
   * property in the DTO.
   *
   * @throws IllegalStateException if the default value is used and DTO has no PublicID property.
   */
  property get DtoKey(): block(dto: DTO): Object {
    return _dtoKey
  }

  property set DtoKey(keyFn(entity: DTO): Object) {
    _dtoKey = keyFn
  }

  /**
   * A block used to retrieve the ID for an Entity. It defaults to a block returning the value of the <code>PublicID</code>
   * property in the entity type.
   *
   * @throws IllegalStateException if the default value is used and E has no PublicID property.
   */
  property get EntityKey(): block(entity: E): Object {
    return _entityKey
  }

  property set EntityKey(keyFn(entity: E): Object) {
    _entityKey = keyFn
  }

  protected property get Authorizer() : Authorizer<E> {
    return _authorizer
  }

  protected function createNewEntity(ctxt:C,newDto:DTO, toCreate(ctxt:C,d:DTO):E):E {
    var context = _creationContextProvider.CurrentContext
    var tempID = findTempID(newDto)
    var entity : E
    if (tempID != null) {
      entity = context.forKey<E>(tempID)
    }

    if ( entity == null ) {
      entity = toCreate(ctxt,newDto)
      if ( tempID != null ) {
        _creationContextProvider.CurrentContext.add(tempID,entity)
      }
    }
    return entity
  }

  protected function findEntity(entities:E[], dtoID:Object):E {
    return entities.firstWhere(\e -> e != null && dtoID == EntityKey(e) && Authorizer.canAccess(e))
  }

  private static reified function getPropertyAccessor<EE>(propertyName : String) : block(item: EE) : Object {
    final var type = EE.Type
    final var propertyDef = type.TypeInfo.getProperty(propertyName)
    if (propertyDef != null) {
      final var accessor = propertyDef.Accessor
      return \item : EE -> accessor.getValue(item)
    }

    return \item : EE -> {
      throw new IllegalStateException("No ${propertyName} property found when updating an instance of ${type}")
    }
  }

  private function findTempID(aDto: DTO): String {
    return _tempKey(aDto)
  }


  /* Work around "could not call abstract method in constructor" gosu limitation. */
  private static reified function getAuthorizer<EE>(authzProvider: IAuthorizerProviderPlugin) : Authorizer<EE> {
    return authzProvider.authorizerFor<EE>(EE)
  }
}
