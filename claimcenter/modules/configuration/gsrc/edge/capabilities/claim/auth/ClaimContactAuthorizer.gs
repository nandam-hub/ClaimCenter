package edge.capabilities.claim.auth

uses edge.capabilities.claim.contact.util.ClaimContactUtil
uses edge.capabilities.claim.lob.ISupportedLobsPlugin
uses edge.security.authorization.AuthorityType
uses edge.security.authorization.Authorizer
uses edge.di.annotations.ForAllGwNodes
uses edge.security.EffectiveUserProvider

/**
 * Access authorizer to claim contacts.
 */
class ClaimContactAuthorizer implements Authorizer<ClaimContact> {

  private var _supportedLobsPlugin: ISupportedLobsPlugin
  private var _userProvider: EffectiveUserProvider as readonly UserProvider

  @ForAllGwNodes("address")
  @ForAllGwNodes("authority")
  @ForAllGwNodes("claim")
  @ForAllGwNodes("document")
  @ForAllGwNodes("enrollment")
  @ForAllGwNodes("fnol")
  @ForAllGwNodes("locale")
  @ForAllGwNodes("segmentation")
  @ForAllGwNodes("servicerequest")
  @Param("supportedLobsPlugin", "Plugin used to get supported lobs")
  construct(supportedLobsPlugin: ISupportedLobsPlugin, aUserProvider: EffectiveUserProvider) {
    _supportedLobsPlugin = supportedLobsPlugin
    _userProvider = aUserProvider
  }

  override function canAccess(contact: ClaimContact): boolean {
    var user = UserProvider.EffectiveUser

    if (!_supportedLobsPlugin.getSupportedLobs().contains(contact.Claim.Policy.PolicyType)) {
      return false
    }

    if (user.getTargets(AuthorityType.PRODUCER).HasElements) {
      // Producers can access any contact
      return true
    }

    if (user.getTargets(AuthorityType.POLICY).HasElements || user.getTargets(AuthorityType.ACCOUNT).HasElements) {
      // Policyholders can access any contact but vendors other than auto repair shops or auto towing agencies
      if (!ClaimContactUtil.isVendor(contact) || AuthorityPolicyCanView(contact)) {
        return true
      }
    }

    final var vendorAuths = user.getTargets(AuthorityType.VENDOR)
    if (vendorAuths.HasElements) {
      // Vendors can see any contact but vendors other than themselves
      if (!ClaimContactUtil.isVendor(contact) || vendorAuths.contains(contact.Contact.AddressBookUID)) {
        return true
      }
    }

    return false
  }

  private function AuthorityPolicyCanView(contact: ClaimContact): boolean {
    /*
     * Policyholders can access any contact but vendors except auto repair shops, auto towing agencies, or if vendor
     * type any of the following: a) CompanyVendor or b) PersonVendor or c.) a subtypes of the type of CompanyVendor or
     * PersonVendor
     */
    var isAuto = contact.AutoRepairShop != null || contact.AutoTowingAgcy != null
    var isCompanyVendor = contact.CompanyVendor != null && contact.Company.Subtype.Code == "CompanyVendor"
    var isPersonVendor = contact.PersonVendor != null
    return isAuto || isCompanyVendor || isPersonVendor
  }
}
