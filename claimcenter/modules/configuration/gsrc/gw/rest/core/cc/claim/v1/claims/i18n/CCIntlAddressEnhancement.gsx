package gw.rest.core.cc.claim.v1.claims.i18n

uses entity.Address

@Export
enhancement CCIntlAddressEnhancement : Address {
  /**
   * Handles setting CEDEX code and the flag.
   * @param code The CEDEX code
   */
  property set CEDEXCode(code: String) {
    if (code != null) {
      this.CEDEXBureau = code
      this.CEDEX = true
    }
  }

  property get CEDEXCode() : String {
    return this.CEDEXBureau
  }
}
