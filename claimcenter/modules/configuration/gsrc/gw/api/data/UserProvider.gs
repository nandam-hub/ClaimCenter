package gw.api.data

uses gw.api.database.Query
uses gw.api.databuilder.CredentialBuilder
uses gw.api.databuilder.UserBuilder
uses gw.api.databuilder.UserContactBuilder

@Export
class UserProvider implements ISampleDataProvider {
  override property get CollectionName() : String {
    return "Sample Portals User"
  }

  override property get AlreadyLoaded() : boolean {
    return Query.make(Credential).compare(Credential#UserName, Equals, "pu").select().AtMostOneRow != null
  }

  override function load() {
    gw.transaction.Transaction.runWithNewBundle(\bundle -> {
      new UserBuilder()
          .withCredential(new CredentialBuilder()
              .withUserName("pu").withPassword("password")
          )
          .withContact(new UserContactBuilder()
              .withName("portal", "user")
              .withEmailAddress1("")
              .withCellPhone(""))
          .withRole(RoleProvider.PortalUserRole)
          .withVacationStatus(VacationStatusType.TC_ATWORK)
          .create(bundle)
    })
  }
}
