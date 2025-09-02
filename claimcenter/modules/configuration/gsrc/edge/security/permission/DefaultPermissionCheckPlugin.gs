package edge.security.permission

uses edge.PlatformSupport.Reflection
uses edge.PlatformSupport.Logger
uses java.lang.Exception
uses edge.di.annotations.ForAllGwNodes
uses edge.PlatformSupport.Entities

class DefaultPermissionCheckPlugin implements IPermissionCheckPlugin{

  private static final var _logger = new Logger(Reflection.getRelativeName(DefaultPermissionCheckPlugin))

  @ForAllGwNodes
  construct(){}

  /**
   * Check if the current user has the given permission associated with the Entity
   */
  @Param("permEntity", "The Entity to check the permission against.")
  @Param("permission", "The permission to check against the given object.")
  @Param("isCheckPermEntity", "If true, will pass the permEntity to the permission property to evaluate against that Entity, otherwise will only evaluate the permission property.")
  @Returns("true if the user has the permission, otherwise false.")
  override function hasPermission(permEntity: Object, permission: String, isCheckPermEntity : boolean): boolean {
    var entType = permEntity typeis KeyableBean ? permEntity.IntrinsicType.RelativeName : permEntity.Class.SimpleName

    try{
      if(isCheckPermEntity){
        return eval("perm." + entType + "." + permission + "(permEntity)") as boolean
      }

      return eval("perm." + entType + "." + permission) as boolean
    }catch(ex : Exception){
      _logger.logError("Failed to evaluate permission check for Entity of type " + entType + " with permission " + permission)
    }

    return false
  }

  /**
   * Check if the current user has the given permission associated with the type
   */
  @Param("permEntityType", "The String value of the permission entity type to check the permission against.")
  @Param("permission", "The permission to check against the given object.")
  @Param("permEntity", "If not null, will pass the permEntity to the permission property to evaluate against that Entity, otherwise will only evaluate the permission property.")
  @Returns("true if the user has the permission, otherwise false.")
  override function hasPermission(permEntityType: String, permission: String, permEntity : Object): boolean {
    try{
      if(permEntity == null){
        return eval("perm." + permEntityType + "." + permission) as boolean
      }

      return eval("perm." + permEntityType + "." + permission + "(permEntity)") as boolean
    }catch(ex : Exception){
      _logger.logError("Failed to evaluate permission check for permission of type " + permEntityType + " with permission " + permission + " for permission object " + permEntity)
    }

    return false
  }

  /**
   * Check if the current user has the given permissions associated with the Entity
   */
  @Param("permEntity", "The Entity to check the permission against.")
  @Param("permissions", "The permissions to check against the given object.")
  @Param("isCheckPermEntity", "If true, will pass the permEntity to the permission properties to evaluate against that Entity, otherwise will only evaluate the permission property.")
  @Returns("true if the user has all the permissions, otherwise false.")
  override function hasPermissions(permEntity: Object, permissions: String[], isCheckPermEntity : boolean): boolean {
    for (perm in permissions) {
      if (!hasPermission(permEntity, perm, isCheckPermEntity)){
        return false
      }
    }

    return true
  }

  /**
   * Check if the current user has the given permissions associated with the type
   */
  @Param("permEntityType", "The String value of the permission Entity type to check the permission against.")
  @Param("permissions", "The permissions to check against the given object.")
  @Param("permEntity", "If not null, will pass the permEntity to the permission property to evaluate against that Entity, otherwise will only evaluate the permission property.")
  @Returns("true if the user has all the permissions, otherwise false.")
  override function hasPermissions(permEntityType: String, permissions: String[], permEntity : Object): boolean {
    for (perm in permissions) {
      if (!hasPermission(permEntityType, perm, permEntity)){
        return false
      }
    }

    return true
  }

  /**
   * Check if the current user has the given System permission
   */
  @Param("permission", "The System permission to check.")
  @Returns("true if the user has the permission, otherwise false.")
  override function hasSystemPermission(permission: SystemPermissionType): boolean {
    try{
      return eval("perm.System." + permission.Code) as boolean
    }catch(e : Exception){
      _logger.logDebug("Failed to evaluate SystemPermission check for permission " + permission)
    }

    return false
  }

  /**
   * Check if the current user has the given System permissions
   */
  @Param("permissions", "The System permissions to check.")
  @Returns("true if the user has all the permissions, otherwise false.")
  override function hasSystemPermissions(permissions: SystemPermissionType[]): boolean {
    for (perm in permissions) {
      if (!hasSystemPermission(perm)){
        return false
      }
    }
    return true
  }

  /**
   * Get the entity that will be used to check a permission against
   */
  override function getPermissionEntity(entityType : String, id: String): Object {
    return Entities.getEntityById(entityType, id)
  }
}
