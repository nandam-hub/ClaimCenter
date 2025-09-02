package gw.surepath.cc.configuration.adminaudit.impl

uses entity.DataAudit_SP
uses gw.api.database.Query
uses gw.api.locale.DisplayKey
uses gw.entity.IEntityPropertyInfo
uses gw.lang.reflect.IFeatureInfo
uses gw.pl.persistence.core.Bundle
uses gw.surepath.cc.configuration.adminaudit.base.AbstractDataAuditor

class HolidayDataAuditor extends AbstractDataAuditor<Holiday> {

  construct(bean: Holiday) {
    super(bean)
  }

  override property get AuditableBeanDisplayName(): String {
    return _auditableBean.Name + " || " + _auditableBean.OccurrenceDate
  }

  override function createAuditDataRecords() : DataAudit_SP[] {
    var bundle = AuditableBean.Bundle
    var auditRecord = new HolidayAudit_SP(bundle)
    associateAuditRecordToAuditableBean(auditRecord, bundle)
    commonPopulateAuditDataRecord(auditRecord)
    return {auditRecord}
  }

  override property get AuditableBeanParentEntityType() : String {
    return DisplayKey.get("SP.AdminAudit.Entity.Holiday")
  }

  override property get AuditableBeanEntityType() : String {
    return DisplayKey.get("SP.AdminAudit.Entity.Holiday")
  }

  override property get AuditableFields() : IFeatureInfo[] {
    return {
        Holiday#Name.FeatureInfo as IEntityPropertyInfo,
        Holiday#OccurrenceDate.FeatureInfo as IEntityPropertyInfo,
        Holiday#AppliesToAllZones.FeatureInfo as IEntityPropertyInfo
    }
  }

  private function associateAuditRecordToAuditableBean(auditRecord: HolidayAudit_SP, bundle: Bundle) {
    if (AuditableBeanStatus == TC_REMOVED) {
      auditRecord.RemovedAuditBeanID = _auditableBean.PublicID
      var priorAuditRecords = Query.make(entity.HolidayAudit_SP)
          .compare(entity.HolidayAudit_SP#Holiday, Equals, _auditableBean).select()
      for (eachPriorRecord in priorAuditRecords) {
        eachPriorRecord = bundle.add(eachPriorRecord)
        eachPriorRecord.RemovedAuditBeanID = eachPriorRecord.PublicID
        if (not Retireable.Type.isAssignableFrom(Holiday)) {
          eachPriorRecord.Holiday = null
        }
      }
    } else {
      auditRecord.Holiday = _auditableBean
    }
  }
}