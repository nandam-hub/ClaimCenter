package edge.util.mapping

uses java.util.HashSet
uses edge.security.authorization.IAuthorizerProviderPlugin
uses java.security.InvalidParameterException

class ArrayUpdater<C, E, DTO> extends UpdaterBase<C,E,DTO> {

  construct(authzProvider: IAuthorizerProviderPlugin) {
    super(authzProvider)
  }

  /**
   * A block used to remove an entity from an array when updating arrays. If this block is null <code>updateArray</code>
   * will throw an exception when trying to remove an entity from the array.
   */
  var _toRemove(context:C, entity:E) as ToRemove


  /**
   * Used by updateArray to create an entity for a new DTO (when <code>DtoKey(dto)==null</code>).
   *
   * When this block is null an exception is thrown if updateArray finds a dto instance with <code>DtoKey</code>==null.
   */
  var _toCreateAndAdd(ctxt:C, d:DTO):E as ToCreateAndAdd


  /**
   * Used by updateArray to add an entity to the updated array. When this property is null an exception is
   * thrown if updateArray finds a dto instance matching no existing entity in the array.
   */
  var _toAdd(c:C,e:E) as ToAdd

  /**
   * Updates an array of entities to match an array of DTOs.
   *
   * @param context the context to be used when updating, passed as a first parameter into AllowedValues,
   * ToRemove, ToCreateAndAdd and ToAdd. May be <code>null</code>
   * @param entities the array of entities to update.
   * @param dtos the array of DTOs used to update the array.
   * @param itemUpdater a block used to update every single item in the resulting array.
   *
   * For each item in <code>dtos</code>:
   *   - If it represents a new entity <code>DtoKey(dto)==null</code>, <code>ToCreateAndAdd</code> is called to generate
   *     a new entity and assign it to the updated array. Then <code>itemUpdater</code> is called to update the
   *     entity contents with the data in the DTO.
   *   - If it represents an entity already in the updated array, then <code>itemUpdater</code> is called to update the
   *     entity contents with the data in the DTO.
   *   - If it represents an entity in the set returned by AllowedValues, but that entity is not in the array. Then
   *     <code>ToAdd</code> is called to add the entity to the array. Then <code>itemUpdater</code> is called to update the
   *     entity contents with the data in the DTO.
   *   - Otherwise the DTO does not represents a valid item for the updated array.
   *
   * <code>ToRemove</code> is called for each entity with no matching DTO.
   */
  function updateArray(context: C, entities: E[], dtos: DTO[], updater(e:E,d:DTO)) {
    var authz = Authorizer
    var entitiesToRemove = authz.access(entities).toSet()

    var dtosFound = new HashSet()
    for (dto in dtos) {
      var entity: E
      var dtoID = DtoKey(dto)
      if (dtoID == null) {
        entity = createAndAdd(context,dto)
      } else {
        checkDuplicatedDto(dtosFound, dtoID)

        entity = findEntity(entities, dtoID)
        if (entity == null) {
          entity = addEntity(context,entities,dtoID)
        }
      }

      /*
       * always retain the entity, in fact an entity could have been found
       * by tempID, dtoID or simply just created
       */
      entitiesToRemove.remove(entity)
      updater(entity, dto)
    }

    if ( entitiesToRemove.HasElements && ToRemove == null ) {
      throw new InvalidParameterException("This updater doesn't allow to remove entities from the array")
    }
    entitiesToRemove.each(\e -> ToRemove(context,e))
  }

  private function checkDuplicatedDto(dtosFound:HashSet, dtoID:Object) {
    if ( dtosFound.contains(dtoID)) {
      var dtoType = DTO
      throw new InvalidParameterException("Duplicated instance found in array of ${dtoType}. DtoKey = ${dtoID}")
    } else {
      dtosFound.add(dtoID)
    }
  }

  private function addEntity(context:C, entities:E[], dtoID:Object):E {
    // Checks that adding items to the array is allowed by the configuration
    if ( ToAdd == null ) {
      throw new InvalidParameterException("The updater is not configured to support adding existing items to the array")
    }

    var allowed = AllowedValues == null ? new E[0] : AllowedValues(context)
    var entity = findEntity(allowed, dtoID)
    if (entity == null) {
      var updaterType = E
      var dtoType = DTO
      throw new InvalidParameterException("Can't find matching ${updaterType} for ${dtoType} with ID = ${dtoID}")
    }
    ToAdd(context, entity)
    return entity
  }

  private function createAndAdd(context: C, dto: DTO): E {
    if ( ToCreateAndAdd == null ) {
      var entityType = E
      throw new InvalidParameterException("Creation of new instances of ${entityType} is not allowed")
    }
    var created = false
    var entity = createNewEntity(context, dto, \ ctxt, d -> {
      created = true
      return ToCreateAndAdd(ctxt, d)
    })
    if (!created) {
      // ToCreateAndAdd was not called; the entity has already been created previously
      // and it has to be added to the array
      ToAdd(context, entity)
    }
    return entity
  }
}
