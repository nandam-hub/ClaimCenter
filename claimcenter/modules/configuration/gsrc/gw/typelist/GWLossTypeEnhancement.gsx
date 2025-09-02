package gw.typelist

uses gw.config.LOBAbstraction

@Export
enhancement GWLossTypeEnhancement: LossType {

  /**
   * Retrieves the Worker's Comp LossType typekey
   */
  public static property get TypekeyUsedForWorkersComp() : LossType {
    return LOBAbstraction.ForClaim.ForLossType.WorkComp
  }
}
