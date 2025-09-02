package edge.capabilities.servicerequest.auth

uses edge.di.annotations.ForAllGwNodes
uses edge.security.EffectiveUserProvider
uses edge.security.authorization.AuthorityType
uses edge.security.authorization.Authorizer

class ServiceRequestDocumentAuthorizer implements Authorizer<Document> {
  var _userProvider : EffectiveUserProvider as readonly UserProvider

  @ForAllGwNodes("servicerequest")
  construct(aUserProvider : EffectiveUserProvider) {
    _userProvider = aUserProvider
  }

  override function canAccess(doc : Document) : boolean {
    if (!isPortalDefaultAccessible(doc) || !perm.Document.view(doc)) {
      return false
    }

    var user = UserProvider.EffectiveUser
    if (user.hasAuthority(AuthorityType.POLICY, doc.Claim.Policy.PolicyNumber)) {
      if (doc.Author == user.Username) {
        return true
      }
    }

    if (user.hasAuthority(AuthorityType.PRODUCER, doc.Claim.Policy.ProducerCode)) {
      return true
    }

    if (user.hasAuthority(AuthorityType.ACCOUNT, doc.Claim.Policy.AccountNumber)) {
      return true
    }

    final var vendorAuths = user.getTargets(AuthorityType.VENDOR)
    if (!vendorAuths.Empty) {
      if (doc.Claim.Contacts*.Contact*.AddressBookUID.hasMatch(\ i -> vendorAuths.contains(i))) {
        return true
      }
    }
    return false
  }

  /**
   * Checks if document is accessible to any portal. Some documents may be restricted
   * for the portal users (like sensitive documents or internal documents).
   */
  static function isPortalDefaultAccessible(document : Document) : Boolean {
    if ( document.SecurityType != DocumentSecurityType.TC_UNRESTRICTED && document.SecurityType != null) {
      return false
    }

    if (document.Retired || document.Obsolete || document.RelatedServiceRequests.size() == 0 ) {
      return false
    }

    return true
  }


}
