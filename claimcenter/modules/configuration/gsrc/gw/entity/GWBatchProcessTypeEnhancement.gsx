package gw.entity

enhancement GWBatchProcessTypeEnhancement : BatchProcessType {

  /**
   * Returns boolean value based on the Batch process is either "Archive" or "Mark Archived Entity Purge Ready"
   * Currently "Mark Archived Entity Purge Ready" batch process is available in Claim Center only.
   */
  property get isArchivingRelated() : boolean {
    return this == typekey.BatchProcessType.TC_ARCHIVE or this.Code == "MarkArchivedEntityPurgeReady"
  }
}
