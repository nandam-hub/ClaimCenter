package edge.capabilities.authorization

uses edge.PlatformSupport.Logger
uses edge.Plugin.pcintegration.authorization.EdgeAuthorizationAPI
uses edge.di.annotations.ForAllGwNodes
uses edge.security.EffectiveUserProvider
uses edge.security.authorization.EdgeAuthorizationDTO
uses java.lang.IllegalArgumentException
uses java.lang.ClassCastException

class DefaultEdgeAuthorizationPlugin implements IEdgeAuthorizationPlugin{

  private static final var LOGGER = new Logger(DefaultEdgeAuthorizationPlugin.Type.QName)
  private var _userProvider: EffectiveUserProvider as readonly UserProvider

  @ForAllGwNodes
  construct(aUserProvider: EffectiveUserProvider) {
    _userProvider = aUserProvider
  }

  @Throws(IllegalArgumentException, "If an illegal argument is passed")
  @Throws(ClassCastException, "If the entityType is not valid")
  override function isAuthorized(entityType: String, entityID: String): boolean {

    try {
      var effectiveUser = UserProvider.EffectiveUser
      var userName = effectiveUser.Username
      return new EdgeAuthorizationAPI(effectiveUser.Token, effectiveUser.UserContext).isAuthorized(userName, entityType, entityID)
    } catch(ex : IllegalArgumentException) {
      LOGGER.logError(ex.LocalizedMessage)
      throw new IllegalArgumentException(ex.LocalizedMessage)
    } catch(ex : ClassCastException) {
      LOGGER.logError(ex.LocalizedMessage)
      throw new ClassCastException(ex.LocalizedMessage)
    }

  }

  @Throws(IllegalArgumentException, "If an illegal argument is passed")
  @Throws(ClassCastException, "If the entityType is not valid")
  override function getAuthorizationsForEntities(entityType: String, entityIDs: String[]): List<EdgeAuthorizationDTO> {

    try {
      var effectiveUser = UserProvider.EffectiveUser
      var userName = effectiveUser.Username
      return new EdgeAuthorizationAPI(effectiveUser.Token, effectiveUser.UserContext).getAuthorizationsForEntities(userName, entityType, entityIDs)
    } catch(ex : IllegalArgumentException) {
      LOGGER.logError(ex.LocalizedMessage)
      throw new IllegalArgumentException(ex.LocalizedMessage)
    } catch(ex : ClassCastException) {
      LOGGER.logError(ex.LocalizedMessage)
      throw new ClassCastException(ex.LocalizedMessage)
    }

  }

  @Throws(IllegalArgumentException, "If an illegal argument is passed")
  override function getAuthorizationsForPolicies(policyNumbers: String[]): List<EdgeAuthorizationDTO> {
    try {
      var effectiveUser = UserProvider.EffectiveUser
      var userName = effectiveUser.Username
      return new EdgeAuthorizationAPI(effectiveUser.Token, effectiveUser.UserContext).getAuthorizationsForPolicies(userName, policyNumbers)
    } catch(ex : IllegalArgumentException) {
      LOGGER.logError(ex.LocalizedMessage)
      throw new IllegalArgumentException(ex.LocalizedMessage)
    } catch(ex : ClassCastException) {
      LOGGER.logError(ex.LocalizedMessage)
      throw new ClassCastException(ex.LocalizedMessage)
    }
  }

  override function isAuthorizedOnAccount(entityID: String): boolean {
    return isAuthorized("Account", entityID)
  }

  override function isAuthorizedOnPolicy(policyNumber: String): boolean {
    try {
      var effectiveUser = UserProvider.EffectiveUser
      var userName = effectiveUser.Username
      return new EdgeAuthorizationAPI(effectiveUser.Token, effectiveUser.UserContext).isAuthorizedForPolicy(userName, policyNumber)
    } catch(ex : IllegalArgumentException) {
      LOGGER.logError(ex.LocalizedMessage)
      throw new IllegalArgumentException(ex.LocalizedMessage)
    } catch(ex : ClassCastException) {
      LOGGER.logError(ex.LocalizedMessage)
      throw new ClassCastException(ex.LocalizedMessage)
    }
  }
}
