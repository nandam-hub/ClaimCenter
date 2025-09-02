package gw.surepath.cc.configuration.timeline.enhancement


enhancement RecoveryEnhancement : entity.Recovery {

  public property get OnsetOriginalRecovery_SP() : Recovery {

    var originOnset = this.OriginTransactionOnset_SP
    return originOnset == null ? null : originOnset.getTransaction() as Recovery;
  }
}
