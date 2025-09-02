package edge.util.mapping

uses edge.security.authorization.IAuthorizerProviderPlugin
uses java.security.InvalidParameterException

class RefUpdater<C, E, DTO> extends UpdaterBase<C,E,DTO> {

  construct(authzProvider: IAuthorizerProviderPlugin) {
    super(authzProvider)
  }

  /**
   * A block used to create new entity instances to update a reference with a newly created DTO.
   * The block takes the following parameters:
   *   C ctxt the context passed as the first parameter in the call to <code>updateRef</code>
   *   dto DTO the DTO instance that that triggered the creation of the new entity.
   *
   * When this property is <code>null</code> the reference updater will throw an exception if the DTO
   * represents a new object (<code>dto.PublicID == null</code>)
   */
  var _toCreate(c:C,d:DTO):E as ToCreate

  /**
   * Updates a reference to an entity to match a DTO instance.
   *
   * @param context the context to be used when updating, passed as a first parameter into AllowedValues, ToCreate.
   * May be <code>null</code>
   * @param aDto the DTO instance to match the reference with.
   * @param itemUpdater a block used to update the entity contents from the DTO
   *
   * When <code>dto</code> represents a new entity (<code>DtoKey(dto)==null</code>) then <code>ToCreate</code> block
   * is invoked to create the new entity, then <code>itemUpdater</code> is invoked to update the contents of the
   * entity with the data in the DTO.
   * When <code>dto</code> matches an entity <code>e</code> in the set returned by <code>AllowedProperties</code>, then
   * <code>itemUpdater</code> is called on that entity to update it with the data in the DTO.
   */
  public function updateRef(ctxt: C, aDto: DTO, itemUpdater(e:E,d:DTO)): E {
    if (aDto == null) {
      return null
    }

    var entity: E
    var dtoID = DtoKey(aDto)
    if (dtoID == null) {
      if ( ToCreate == null ) {
        throw new InvalidParameterException("This updater is not configured to create new instances")
      }
      entity = createNewEntity(ctxt, aDto, ToCreate)
    } else {
      entity = findMatchingEntity(ctxt, dtoID)
    }
    itemUpdater(entity, aDto)

    return entity
  }

  private function findMatchingEntity(ctxt:C, dtoID:Object):E {
    if (AllowedValues == null) {
      var updaterType = E.Type
      var dtoType = DTO.Type
      throw new InvalidParameterException(
          "This updater<${updaterType}> is not configured to allow existing entities to be added to the array. (${dtoType} ID=${dtoID})"
      )
    }
    var entity = findEntity(AllowedValues(ctxt), dtoID)
    if (entity == null) {
      var updaterType = E.Type
      var dtoType = DTO.Type
      throw new InvalidParameterException("Can't find matching ${updaterType} for ${dtoType} with ID = ${dtoID}")
    }
    return entity
  }

}
