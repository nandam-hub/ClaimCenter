package gw.surepath.cc.configuration.adminaudit.impl

uses gw.api.database.Query
uses gw.api.locale.DisplayKey
uses gw.entity.IForeignKeyPropertyInfo
uses gw.lang.reflect.IFeatureInfo
uses gw.pl.persistence.core.Bundle
uses gw.surepath.cc.configuration.adminaudit.base.AbstractDataAuditor
uses entity.DataAudit_SP

class GroupRegionDataAuditor extends AbstractDataAuditor<GroupRegion> {

  construct(bean: GroupRegion) {
    super(bean)
  }

  override property get AuditableBeanDisplayName(): String {
    return _auditableBean.Region + " || " + _auditableBean.Group
  }

  override function createAuditDataRecords() : DataAudit_SP[] {
    var bundle = AuditableBean.Bundle
    var auditRecord = new GroupAudit_SP(bundle)
    associateAuditRecordToAuditableBean(auditRecord, bundle)
    commonPopulateAuditDataRecord(auditRecord)
    return {auditRecord}
  }

  override property get AuditableBeanParentEntityType() : String {
    return DisplayKey.get("SP.AdminAudit.Entity.Group")
  }

  override property get AuditableBeanEntityType() : String {
    return DisplayKey.get("SP.AdminAudit.Entity.GroupRegion")
  }

  override property get AuditableFields() : IFeatureInfo[] {
    return {
        GroupRegion#Group.FeatureInfo as IForeignKeyPropertyInfo,
        GroupRegion#Region.FeatureInfo as IForeignKeyPropertyInfo
    }
  }

  private function associateAuditRecordToAuditableBean(auditRecord: GroupAudit_SP, bundle: Bundle) {
    if (AuditableBeanStatus == TC_REMOVED) {
      auditRecord.RemovedAuditBeanID = _auditableBean.PublicID
      var priorAuditRecords = Query.make(entity.GroupAudit_SP)
          .compare(entity.GroupAudit_SP#Group, Equals, _auditableBean.Group).select()
      for (eachPriorRecord in priorAuditRecords) {
        eachPriorRecord = bundle.add(eachPriorRecord)
        eachPriorRecord.RemovedAuditBeanID = eachPriorRecord.PublicID
        if (not Retireable.Type.isAssignableFrom(Group)) {
          eachPriorRecord.Group = null
        }
      }
    } else {
      auditRecord.Group = _auditableBean.Group
    }
  }

}