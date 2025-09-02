package edge.capabilities.claim.contact.util

uses java.lang.UnsupportedOperationException

final class ClaimContactUtil {

  private construct() {
    throw new UnsupportedOperationException()
  }


  public static function isVendor(c:ClaimContact):boolean {
    return c.CompanyVendor != null || c.PersonVendor != null
  } 
}
