package gw.surepath.cc.configuration.adminaudit.impl

uses entity.DataAudit_SP
uses gw.api.database.Query
uses gw.api.locale.DisplayKey
uses gw.entity.IEntityPropertyInfo
uses gw.entity.IForeignKeyPropertyInfo
uses gw.lang.reflect.IFeatureInfo
uses gw.pl.persistence.core.Bundle
uses gw.surepath.cc.configuration.adminaudit.base.AbstractDataAuditor

class UserDataAuditor extends AbstractDataAuditor<User> {

  construct(bean: User) {
    super(bean)
  }

  override property get AuditableBeanDisplayName(): String {
    return _auditableBean.DisplayName
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
    return DisplayKey.get("SP.AdminAudit.Entity.User")
  }

  override property get AuditableFields() : IFeatureInfo[] {
    return {
        User#DefaultCountry.FeatureInfo as IEntityPropertyInfo,
        User#DefaultPhoneCountry.FeatureInfo as IEntityPropertyInfo,
        User#Department.FeatureInfo as IEntityPropertyInfo,
        User#ExperienceLevel.FeatureInfo as IEntityPropertyInfo,
        User#ExternalUser.FeatureInfo as IEntityPropertyInfo,
        User#JobTitle.FeatureInfo as IEntityPropertyInfo,
        User#Organization.FeatureInfo as IEntityPropertyInfo,
        User#SystemUserType.FeatureInfo as IEntityPropertyInfo,
        User#VacationStatus.FeatureInfo as IEntityPropertyInfo,
        User#AuthorityProfile.FeatureInfo as IForeignKeyPropertyInfo
    }
  }

  private function associateAuditRecordToAuditableBean(auditRecord: UserAudit_SP, bundle: Bundle) {
    if (AuditableBeanStatus == TC_REMOVED) {
      auditRecord.RemovedAuditBeanID = _auditableBean.PublicID
      var priorAuditRecords = Query.make(entity.UserAudit_SP)
          .compare(entity.UserAudit_SP#User, Equals, _auditableBean).select()
      for (eachPriorRecord in priorAuditRecords) {
        eachPriorRecord = bundle.add(eachPriorRecord)
        eachPriorRecord.RemovedAuditBeanID = eachPriorRecord.PublicID
        if (not Retireable.Type.isAssignableFrom(User)) {
          eachPriorRecord.User = null
        }
      }
    } else {
      auditRecord.User = _auditableBean
    }
  }
}