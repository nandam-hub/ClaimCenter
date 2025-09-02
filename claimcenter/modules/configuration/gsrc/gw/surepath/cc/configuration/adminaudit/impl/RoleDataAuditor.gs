package gw.surepath.cc.configuration.adminaudit.impl

uses entity.DataAudit_SP
uses gw.api.database.Query
uses gw.api.locale.DisplayKey
uses gw.entity.IEntityPropertyInfo
uses gw.lang.reflect.IFeatureInfo
uses gw.pl.persistence.core.Bundle
uses gw.surepath.cc.configuration.adminaudit.base.AbstractDataAuditor

class RoleDataAuditor extends AbstractDataAuditor<Role> {

  construct(bean: Role) {
    super(bean)
  }

  override property get AuditableBeanDisplayName(): String {
    return _auditableBean.DisplayName
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
    return DisplayKey.get("SP.AdminAudit.Entity.Role")
  }

  override property get AuditableFields() : IFeatureInfo[] {
    return {
        Role#Name.FeatureInfo as IEntityPropertyInfo,
        Role#CarrierInternalRole.FeatureInfo as IEntityPropertyInfo,
        Role#RoleType.FeatureInfo as IEntityPropertyInfo,
        Role#Description.FeatureInfo as IEntityPropertyInfo
    }
  }

  private function associateAuditRecordToAuditableBean(auditRecord: RoleAudit_SP, bundle: Bundle) {
    if (AuditableBeanStatus == TC_REMOVED) {
      auditRecord.RemovedAuditBeanID = _auditableBean.PublicID
      var priorAuditRecords = Query.make(entity.RoleAudit_SP)
          .compare(entity.RoleAudit_SP#Role, Equals, _auditableBean).select()
      for (eachPriorRecord in priorAuditRecords) {
        eachPriorRecord = bundle.add(eachPriorRecord)
        eachPriorRecord.RemovedAuditBeanID = eachPriorRecord.PublicID
        if (not Retireable.Type.isAssignableFrom(Role)) {
          eachPriorRecord.Role = null
        }
      }
    } else {
      auditRecord.Role = _auditableBean
    }
  }
}