package edge.capabilities.claim.auth
uses edge.capabilities.claim.contact.util.ClaimContactUtil
uses edge.security.authorization.Authorizer
uses edge.di.annotations.ForAllGwNodes
uses edge.security.authorization.AuthorityType
uses edge.security.EffectiveUserProvider

/**
 * Document access logic.
 */
class DocumentAuthorizer implements Authorizer<Document> {
  var _userProvider : EffectiveUserProvider as readonly UserProvider

  @ForAllGwNodes("claim")
  @ForAllGwNodes("fnol")
  @ForAllGwNodes("document")
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
    if (vendorAuths.HasElements &&
        doc.Claim.Contacts.where(\cc -> ClaimContactUtil.isVendor(cc))*.Contact*.AddressBookUID
            .hasMatch(\s -> vendorAuths.contains(s))) {
      return true
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

    if (document.Retired || document.Obsolete ) {
      return false
    }

    return true
  }


}
