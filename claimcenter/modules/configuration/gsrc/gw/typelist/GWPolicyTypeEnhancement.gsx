package gw.typelist

uses gw.config.LOBAbstraction

@Export
enhancement GWPolicyTypeEnhancement : typekey.PolicyType {
  /**
   * Indicates whether this policy type should allow risk units to be selected when policies of this type
   * are retrieved from the policy system. Many policy types have only a few risk units so we fetch all of
   * them when we fetch the policy. But some policy types often have a large number of risk units and, for
   * such policy types, we usually provide a mechanism for the user to select just the risk units they want
   * to be fetched. Customers can edit this property according to the policy types they have on their system
   */
  public property get AllowsRiskUnitSelection() : boolean {
    return this == LOBAbstraction.ForPolicy.CommercialAutoPolicyType or this == LOBAbstraction.ForPolicy.CommercialPropertyPolicyType
  }

  property get Icon() : String {
    var icon = LOBAbstraction.ForPolicy.PolicyTypeToIcon[this] ?:
        this.Categories.contains(SourceSystem.TC_APD) ? "apd_app_icon" : "general_liability"
    return icon
  }
}
