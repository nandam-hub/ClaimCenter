package gw.entity

@Export
enhancement GWActivityWorkplanEnhancement : Activity {

  /**
   * Returns a line-separated list of all exposures belonging to the claim with that activity
   */
  property get ExposuresString(): String {
    if (this.Exposure == null and this.Claimant != null) {
      return this.Claim.getExposuresForClaimant(this.Claimant).join("\n")
    } else if (this.Exposure != null) {
      return this.Exposure as String
    } else {
      return ""
    }
  }
}
