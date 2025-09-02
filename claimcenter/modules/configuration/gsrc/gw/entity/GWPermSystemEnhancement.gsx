package gw.entity

@Export
enhancement GWPermSystemEnhancement: perm.System {
  static property get CanVisitBizRules(): boolean {
    return perm.Rule.view or
        perm.System.activityruleview or
        perm.System.exposureruleview or
        perm.System.reserveruleview
  }
}