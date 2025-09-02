package edge.capabilities.claim.auth

uses edge.security.authorization.Authorizer
uses edge.security.EffectiveUserProvider
uses edge.di.annotations.ForAllGwNodes

class NoteAuthorizer implements Authorizer<Note> {
  var _userProvider : EffectiveUserProvider as readonly UserProvider

  @ForAllGwNodes
  construct(aUserProvider: EffectiveUserProvider) {
    _userProvider = aUserProvider
  }

  override function canAccess(note: Note): boolean {
    if(!note.PortalAuthorUsername_Ext.HasContent) {
      return false
    }

    return note.PortalAuthorUsername_Ext.equalsIgnoreCase(UserProvider.EffectiveUser.Username)
  }
}
