package gw.surepath.cc.configuration.adminaudit.impl

uses gw.api.database.Query
uses gw.api.locale.DisplayKey
uses gw.entity.IEntityPropertyInfo
uses gw.lang.reflect.IFeatureInfo
uses gw.pl.persistence.core.Bundle
uses gw.surepath.cc.configuration.adminaudit.base.AbstractDataAuditor
uses entity.DataAudit_SP

class ActivityPatternDataAuditor extends AbstractDataAuditor<ActivityPattern> {

  construct(bean: ActivityPattern) {
    super(bean)
  }

  override property get AuditableBeanDisplayName(): String {
    return _auditableBean.Code + " || " + _auditableBean.Category
  }

  override function createAuditDataRecords() : DataAudit_SP[] {
    var bundle = AuditableBean.Bundle
    var auditRecord = new ActivityPatternAudit_SP(bundle)
    associateAuditRecordToAuditableBean(auditRecord, bundle)
    commonPopulateAuditDataRecord(auditRecord)
    return {auditRecord}
  }

  override property get AuditableBeanParentEntityType() : String {
    return DisplayKey.get("SP.AdminAudit.Entity.ActivityPattern")
  }

  override property get AuditableBeanEntityType() : String {
    return DisplayKey.get("SP.AdminAudit.Entity.ActivityPattern")
  }

  override property get AuditableFields() : IFeatureInfo[] {
    return {
        ActivityPattern#ActivityClass.FeatureInfo as IEntityPropertyInfo,
        ActivityPattern#AutomatedOnly.FeatureInfo as IEntityPropertyInfo,
        ActivityPattern#Category.FeatureInfo as IEntityPropertyInfo,
        ActivityPattern#Code.FeatureInfo as IEntityPropertyInfo,
        ActivityPattern#Command.FeatureInfo as IEntityPropertyInfo,
        ActivityPattern#Description.FeatureInfo as IEntityPropertyInfo,
        ActivityPattern#DocumentTemplate.FeatureInfo as IEntityPropertyInfo,
        ActivityPattern#EmailTemplate.FeatureInfo as IEntityPropertyInfo,
        ActivityPattern#EscalationBusCalTag.FeatureInfo as IEntityPropertyInfo,
        ActivityPattern#EscalationDays.FeatureInfo as IEntityPropertyInfo,
        ActivityPattern#EscalationHours.FeatureInfo as IEntityPropertyInfo,
        ActivityPattern#EscalationInclDays.FeatureInfo as IEntityPropertyInfo,
        ActivityPattern#EscalationStartPt.FeatureInfo as IEntityPropertyInfo,
        ActivityPattern#Mandatory.FeatureInfo as IEntityPropertyInfo,
        ActivityPattern#Priority.FeatureInfo as IEntityPropertyInfo,
        ActivityPattern#Recurring.FeatureInfo as IEntityPropertyInfo,
        ActivityPattern#ShortSubject.FeatureInfo as IEntityPropertyInfo,
        ActivityPattern#Subject.FeatureInfo as IEntityPropertyInfo,
        ActivityPattern#TargetBusCalLocPath.FeatureInfo as IEntityPropertyInfo,
        ActivityPattern#TargetBusCalTag.FeatureInfo as IEntityPropertyInfo,
        ActivityPattern#TargetDays.FeatureInfo as IEntityPropertyInfo,
        ActivityPattern#TargetHours.FeatureInfo as IEntityPropertyInfo,
        ActivityPattern#TargetIncludeDays.FeatureInfo as IEntityPropertyInfo,
        ActivityPattern#TargetStartPoint.FeatureInfo as IEntityPropertyInfo,
        ActivityPattern#Type.FeatureInfo as IEntityPropertyInfo
    }
  }

  private function associateAuditRecordToAuditableBean(auditRecord: ActivityPatternAudit_SP, bundle: Bundle) {
    if (AuditableBeanStatus == TC_REMOVED) {
      auditRecord.RemovedAuditBeanID = _auditableBean.PublicID
      var priorAuditRecords = Query.make(entity.ActivityPatternAudit_SP)
          .compare(entity.ActivityPatternAudit_SP#ActivityPattern, Equals, _auditableBean).select()
      for (eachPriorRecord in priorAuditRecords) {
        eachPriorRecord = bundle.add(eachPriorRecord)
        eachPriorRecord.RemovedAuditBeanID = eachPriorRecord.PublicID
        if (not Retireable.Type.isAssignableFrom(ActivityPattern)) {
          eachPriorRecord.ActivityPattern = null
        }
      }
    } else {
      auditRecord.ActivityPattern = _auditableBean
    }
  }
}