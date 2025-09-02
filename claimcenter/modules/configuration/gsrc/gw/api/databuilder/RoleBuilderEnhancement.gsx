package gw.api.databuilder

@Export
enhancement RoleBuilderEnhancement: RoleBuilder {
  /**
   * Add the supplied permissions to the role.
   * @param permissions
   */
  function withPermissions(permissions : Iterable<SystemPermissionType>): RoleBuilder {
    permissions.forEach(\perm -> this.withPermission(perm))
    return this
  }
}
