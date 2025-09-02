package gw.surepath.cc.configuration.adminaudit.impl

uses gw.api.database.Query
uses gw.api.locale.DisplayKey
uses gw.entity.IEntityPropertyInfo
uses gw.entity.IForeignKeyPropertyInfo
uses gw.lang.reflect.IFeatureInfo
uses gw.pl.persistence.core.Bundle
uses gw.surepath.cc.configuration.adminaudit.base.AbstractDataAuditor

class GroupUserDataAuditor extends AbstractDataAuditor<GroupUser> {

  construct(bean: GroupUser) {
    super(bean)
  }

  override property get AuditableBeanDisplayName(): String {
    return _auditableBean.User + " || " + _auditableBean.Group
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
    return DisplayKey.get("SP.AdminAudit.Entity.GroupUser")
  }

  override property get AuditableFields() : IFeatureInfo[] {
    return {
        GroupUser#Group.FeatureInfo as IForeignKeyPropertyInfo,
        GroupUser#User.FeatureInfo as IForeignKeyPropertyInfo,
        GroupUser#LoadFactor.FeatureInfo as IEntityPropertyInfo,
        GroupUser#Member.FeatureInfo as IEntityPropertyInfo,
        GroupUser#Manager.FeatureInfo as IEntityPropertyInfo,
        GroupUser#LoadFactorType.FeatureInfo as IEntityPropertyInfo
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