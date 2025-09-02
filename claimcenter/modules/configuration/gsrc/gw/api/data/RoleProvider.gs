package gw.api.data

uses gw.api.database.Query

class RoleProvider implements ISampleDataProvider {
  override property get CollectionName() : String {
    return "Sample Portals Roles"
  }

  override property get AlreadyLoaded() : boolean {
    return PortalUserRole != null
  }

  override function load() {
    gw.transaction.Transaction.runWithNewBundle(\bundle -> {
      new gw.api.databuilder.RoleBuilder()
          .withNameAndPublicId("Portal User")
          .withPermission(SystemPermissionType.TC_ACTCREATE)
          .withPermission(SystemPermissionType.TC_ACTEDITUNOWNED)
          .withPermission(SystemPermissionType.TC_CLAIMCREATE)
          .withPermission(SystemPermissionType.TC_CLAIMEDIT)
          .withPermission(SystemPermissionType.TC_CLAIMRAOWN)
          .withPermission(SystemPermissionType.TC_DOCCREATE)
          .withPermission(SystemPermissionType.TC_DOCEDIT)
          .withPermission(SystemPermissionType.TC_DOCVIEW)
          .withPermission(SystemPermissionType.TC_DOCDELETE)
          .withPermission(SystemPermissionType.TC_IGNOREACL)
          .withPermission(SystemPermissionType.TC_NOTECREATE)
          .create(bundle)
    })
  }

  static property get PortalUserRole(): Role {
    var role = Query.make(Role).compare(Role#PublicID, Equals, "PortalUser").select().AtMostOneRow
    return role
  }
}
