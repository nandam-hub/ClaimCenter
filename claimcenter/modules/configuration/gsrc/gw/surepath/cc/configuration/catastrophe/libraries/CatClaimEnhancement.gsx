package gw.surepath.cc.configuration.catastrophe.libraries

uses gw.surepath.cc.configuration.catastrophe.util.CatastropheProperties
uses gw.surepath.suite.configuration.annotation.IncludeInDocumentation

/**
 * Enhancement to the OOTB Claim entity for the Proactive Catastrophe Management Feature
 */
@IncludeInDocumentation
enhancement CatClaimEnhancement : Claim {

  /**
   * Find the eligible catastrophes to associate to this claim
   */
  @IncludeInDocumentation
  function retrieveEligibleCatastrophiesForClaim(): Catastrophe[] {
    if (CatastropheProperties.INSTANCE.FeatureEnabled) {
      return this.getCatastropheMatchesByZone().where(\elt -> elt.CatastropheValidTo != null)
    } else {
      return this.getCatastropheMatchesByZone()
    }
  }

}
