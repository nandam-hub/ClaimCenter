package gw.surepath.cc.configuration.adminaudit.impl

uses gw.api.database.Query
uses gw.api.locale.DisplayKey
uses gw.entity.IEntityPropertyInfo
uses gw.entity.IForeignKeyPropertyInfo
uses gw.lang.reflect.IFeatureInfo
uses gw.pl.persistence.core.Bundle
uses gw.surepath.cc.configuration.adminaudit.base.AbstractDataAuditor

class RolePrivilegeDataAuditor extends AbstractDataAuditor<RolePrivilege> {

  construct(bean: RolePrivilege) {
    super(bean)
  }

  override property get AuditableBeanDisplayName(): String {
    return _auditableBean.Role.DisplayName + " || " + _auditableBean.Permission.Code
  }

  override function createAuditDataRecords() : DataAudit_SP[] {
    var bundle = AuditableBean.Bundle
    var auditRecord = new RoleAudit_SP(bundle)
    associateAuditRecordToAuditableBean(auditRecord, bundle)
    commonPopulateAuditDataRecord(auditRecord)
    return {auditRecord}
  }

  override property get AuditableBeanParentEntityType() : String {
    return DisplayKey.get("SP.AdminAudit.Entity.Role")
  }

  override property get AuditableBeanEntityType() : String {
    return DisplayKey.get("SP.AdminAudit.Entity.RolePrivilege")
  }

  override property get AuditableFields() : IFeatureInfo[] {
    return {
        RolePrivilege#Role.FeatureInfo as IForeignKeyPropertyInfo,
        RolePrivilege#Permission.FeatureInfo as IEntityPropertyInfo
    }
  }

  private function associateAuditRecordToAuditableBean(auditRecord: RoleAudit_SP, bundle: Bundle) {
    if (AuditableBeanStatus == TC_REMOVED) {
      auditRecord.RemovedAuditBeanID = _auditableBean.PublicID
      var priorAuditRecords = Query.make(entity.RoleAudit_SP)
          .compare(entity.RoleAudit_SP#Role, Equals, _auditableBean.Role).select()
      for (eachPriorRecord in priorAuditRecords) {
        eachPriorRecord = bundle.add(eachPriorRecord)
        eachPriorRecord.RemovedAuditBeanID = eachPriorRecord.PublicID
        if (not Retireable.Type.isAssignableFrom(Role)) {
          eachPriorRecord.Role = null
        }
      }
    } else {
      auditRecord.Role = _auditableBean.Role
    }
  }

}