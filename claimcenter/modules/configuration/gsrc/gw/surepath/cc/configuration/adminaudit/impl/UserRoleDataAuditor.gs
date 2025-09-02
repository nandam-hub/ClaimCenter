package gw.surepath.cc.configuration.adminaudit.impl

uses gw.api.database.Query
uses gw.api.locale.DisplayKey
uses gw.entity.IForeignKeyPropertyInfo
uses gw.lang.reflect.IFeatureInfo
uses gw.pl.persistence.core.Bundle
uses gw.surepath.cc.configuration.adminaudit.base.AbstractDataAuditor

class UserRoleDataAuditor extends AbstractDataAuditor<UserRole> {

  construct(bean: UserRole) {
    super(bean)
  }

  override property get AuditableBeanDisplayName(): String {
    return _auditableBean.Role.DisplayName + " || " + _auditableBean.User.DisplayName
  }

  override function createAuditDataRecords() : DataAudit_SP[] {
    var bundle = AuditableBean.Bundle
    var auditRecord = new UserAudit_SP(bundle)
    associateAuditRecordToAuditableBean(auditRecord, bundle)
    commonPopulateAuditDataRecord(auditRecord)
    return {auditRecord}
  }

  override property get AuditableBeanParentEntityType() : String {
    return DisplayKey.get("SP.AdminAudit.Entity.User")
  }

  override property get AuditableBeanEntityType() : String {
    return DisplayKey.get("SP.AdminAudit.Entity.UserRole")
  }

  override property get AuditableFields() : IFeatureInfo[] {
    return {
        UserRole#User.FeatureInfo as IForeignKeyPropertyInfo,
        UserRole#Role.FeatureInfo as IForeignKeyPropertyInfo
    }
  }

  private function associateAuditRecordToAuditableBean(auditRecord: UserAudit_SP, bundle: Bundle) {
    if (AuditableBeanStatus == TC_REMOVED) {
      auditRecord.RemovedAuditBeanID = _auditableBean.PublicID
      var priorAuditRecords = Query.make(entity.UserAudit_SP)
          .compare(entity.UserAudit_SP#User, Equals, _auditableBean.User).select()
      for (eachPriorRecord in priorAuditRecords) {
        eachPriorRecord = bundle.add(eachPriorRecord)
        eachPriorRecord.RemovedAuditBeanID = eachPriorRecord.PublicID
        if (not Retireable.Type.isAssignableFrom(User)) {
          eachPriorRecord.User = null
        }
      }
    } else {
      auditRecord.User = _auditableBean.User
    }
  }

}