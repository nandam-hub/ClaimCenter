package gw.surepath.cc.configuration.adminaudit.impl

uses entity.DataAudit_SP
uses gw.api.database.Query
uses gw.api.locale.DisplayKey
uses gw.entity.IEntityPropertyInfo
uses gw.lang.reflect.IFeatureInfo
uses gw.pl.persistence.core.Bundle
uses gw.surepath.cc.configuration.adminaudit.base.AbstractDataAuditor

class UserContactDataAuditor extends AbstractDataAuditor<UserContact> {

  construct(bean: UserContact) {
    super(bean)
  }

  override property get AuditableBeanDisplayName(): String {
    return AuditableBean.DisplayName
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
    return DisplayKey.get("SP.AdminAudit.Entity.UserContact")
  }

  override property get AuditableFields() : IFeatureInfo[] {
    return {
        UserContact#FirstName.FeatureInfo as IEntityPropertyInfo,
        UserContact#MiddleName.FeatureInfo as IEntityPropertyInfo,
        UserContact#LastName.FeatureInfo as IEntityPropertyInfo,
        UserContact#Prefix.FeatureInfo as IEntityPropertyInfo,
        UserContact#Suffix.FeatureInfo as IEntityPropertyInfo,
        UserContact#PrimaryAddress.FeatureInfo as IEntityPropertyInfo
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