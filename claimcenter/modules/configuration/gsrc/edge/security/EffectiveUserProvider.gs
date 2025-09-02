package edge.security

uses java.lang.ThreadLocal
uses edge.di.annotations.ForAllGwNodes

/**
 * Injected class used as a proxy to the Effective User that is associated with the JsonRPC Request
**/
class EffectiveUserProvider {

  @ForAllGwNodes
  construct() {}

  private static var _user = new ThreadLocal<EffectiveUser>()

  static property set User(aUser:EffectiveUser) {
    _user.set(aUser)
  }

  property get EffectiveUser():EffectiveUser {
    return _user.get()
  }
}
