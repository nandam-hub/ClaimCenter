package gw.surepath.cc.configuration.adminaudit.impl

uses entity.DataAudit_SP
uses gw.api.database.Query
uses gw.api.locale.DisplayKey
uses gw.entity.IEntityPropertyInfo
uses gw.entity.IForeignKeyPropertyInfo
uses gw.lang.reflect.IFeatureInfo
uses gw.pl.persistence.core.Bundle
uses gw.surepath.cc.configuration.adminaudit.base.AbstractDataAuditor

class AuthorityLimitDataAuditor extends AbstractDataAuditor<AuthorityLimit> {

  construct(bean: AuthorityLimit) {
    super(bean)
  }

  override property get AuditableBeanDisplayName(): String {
    return _auditableBean.LimitType + " || " + _auditableBean.LimitAmount + " || " + _auditableBean.Profile.Name
  }

  override function createAuditDataRecords() : DataAudit_SP[] {
    var bundle = AuditableBean.Bundle
    var auditRecord = new AuthLimitProfileAudit_SP(bundle)
    associateAuditRecordToAuditableBean(auditRecord, bundle)
    commonPopulateAuditDataRecord(auditRecord)
    return {auditRecord}
  }

  override property get AuditableBeanParentEntityType() : String {
    return DisplayKey.get("SP.AdminAudit.Entity.AuthorityLimitProfile")
  }

  override property get AuditableBeanEntityType() : String {
    return DisplayKey.get("SP.AdminAudit.Entity.AuthorityLimit")
  }

  override property get AuditableFields() : IFeatureInfo[] {
    return {
        AuthorityLimit#LimitAmount.FeatureInfo as IEntityPropertyInfo,
        AuthorityLimit#LimitType.FeatureInfo as IEntityPropertyInfo,
        AuthorityLimit#Profile.FeatureInfo as IForeignKeyPropertyInfo
    }
  }

  private function associateAuditRecordToAuditableBean(auditRecord: AuthLimitProfileAudit_SP, bundle: Bundle) {
    if (AuditableBeanStatus == TC_REMOVED) {
      auditRecord.RemovedAuditBeanID = _auditableBean.PublicID
      var priorAuditRecords = Query.make(entity.AuthLimitProfileAudit_SP)
          .compare(entity.AuthLimitProfileAudit_SP#AuthLimitProfile, Equals, _auditableBean.Profile).select()
      for (eachPriorRecord in priorAuditRecords) {
        eachPriorRecord = bundle.add(eachPriorRecord)
        eachPriorRecord.RemovedAuditBeanID = eachPriorRecord.PublicID
        if (not Retireable.Type.isAssignableFrom(AuthorityLimitProfile)) {
          eachPriorRecord.AuthLimitProfile = null
        }
      }
    } else {
      auditRecord.AuthLimitProfile = _auditableBean.Profile
    }
  }
}