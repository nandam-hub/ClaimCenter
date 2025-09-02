package gw.entity

@Export
enhancement GWPersonPreferredCommunicationsMethodEnhancement : Person {
  property get ClaimUpdatesViaEmailOptInValue() : String {
    return this.ClaimUpdatesViaEmailOptIn?.readValueFromContact(this)
  }

  property get ClaimUpdatesViaTextOptInValue() : String {
    return this.ClaimUpdatesViaTextOptIn?.readValueFromContact(this)
  }
}