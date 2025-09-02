package edge.security.permission

/**
 * Interface for Entity and System Permission checking
 */
interface IPermissionCheckPlugin {

  function hasPermission(permEntity : Object, permission : String, isCheckPermEntity : boolean) : boolean
  function hasPermission(permEntityType : String, permission : String, permEntity : Object) : boolean
  function hasPermissions(permEntity : Object, permissions : String[], isCheckPermEntity : boolean) : boolean
  function hasPermissions(permEntityType : String, permissions : String[], permEntity : Object) : boolean
  function hasSystemPermission(permission : typekey.SystemPermissionType) : boolean
  function hasSystemPermissions(permissions : typekey.SystemPermissionType[]) : boolean
  function getPermissionEntity(entityType : String, id : String) : Object

}
