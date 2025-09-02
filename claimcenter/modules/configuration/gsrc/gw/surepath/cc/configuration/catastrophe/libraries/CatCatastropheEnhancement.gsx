package gw.surepath.cc.configuration.catastrophe.libraries

uses gw.surepath.cc.configuration.catastrophe.util.CatastropheProperties
uses gw.surepath.suite.configuration.annotation.IncludeInDocumentation

@Export
enhancement CatCatastropheEnhancement: Catastrophe {

  /**
   * Updates the catastrophe claim status flag to match UI enabled field.
   * We keep the UI and data model separate to preserve compatibility with existing/sample claims
   * that do not have an associated Catastrophe Claim template. Catastrophes with claim templates
   * can therefore coexist with legacy catastrophes (lacking claim templates).
   */
  @IncludeInDocumentation
  public function updateTemplateEnabledFlag(enabledFlag : boolean) {
    if (CatastropheProperties.INSTANCE.FeatureEnabled) {
      if (enabledFlag and this.CatClaimTemplateSettings_SP == null) {
        this.CatClaimTemplateSettings_SP = new ClaimTemplateSettings_SP()
      }
      this.CatClaimTemplateSettings_SP.Active = enabledFlag
    }
  }
}
