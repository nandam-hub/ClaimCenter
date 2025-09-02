package gw.surepath.cc.configuration.adminaudit.impl

uses gw.api.database.Query
uses gw.api.locale.DisplayKey
uses gw.entity.IEntityPropertyInfo
uses gw.entity.IForeignKeyPropertyInfo
uses gw.lang.reflect.IFeatureInfo
uses gw.pl.persistence.core.Bundle
uses gw.surepath.cc.configuration.adminaudit.base.AbstractDataAuditor

class RegionZoneDataAuditor extends AbstractDataAuditor<RegionZone> {

  construct(bean: RegionZone) {
    super(bean)
  }

  override property get AuditableBeanDisplayName(): String {
    return _auditableBean.Region.DisplayName + " || " + _auditableBean.ZoneType.Code + " || " + _auditableBean.Code
  }

  override function createAuditDataRecords() : DataAudit_SP[] {
    var bundle = AuditableBean.Bundle
    var auditRecord = new RegionAudit_SP(bundle)
    associateAuditRecordToAuditableBean(auditRecord, bundle)
    commonPopulateAuditDataRecord(auditRecord)
    return {auditRecord}
  }

  override property get AuditableBeanParentEntityType() : String {
    return DisplayKey.get("SP.AdminAudit.Entity.Region")
  }

  override property get AuditableBeanEntityType() : String {
    return DisplayKey.get("SP.AdminAudit.Entity.RegionZone")
  }

  override property get AuditableFields() : IFeatureInfo[] {
    return {
        RegionZone#Region.FeatureInfo as IForeignKeyPropertyInfo,
        RegionZone#ZoneType.FeatureInfo as IEntityPropertyInfo,
        RegionZone#Country.FeatureInfo as IEntityPropertyInfo,
        RegionZone#Code.FeatureInfo as IEntityPropertyInfo
    }
  }

  private function associateAuditRecordToAuditableBean(auditRecord: RegionAudit_SP, bundle: Bundle) {
    if (AuditableBeanStatus == TC_REMOVED) {
      auditRecord.RemovedAuditBeanID = _auditableBean.PublicID
      var priorAuditRecords = Query.make(entity.RegionAudit_SP)
          .compare(entity.RegionAudit_SP#Region, Equals, _auditableBean.Region).select()
      for (eachPriorRecord in priorAuditRecords) {
        eachPriorRecord = bundle.add(eachPriorRecord)
        eachPriorRecord.RemovedAuditBeanID = eachPriorRecord.PublicID
        if (not Retireable.Type.isAssignableFrom(Region)) {
          eachPriorRecord.Region = null
        }
      }
    } else {
      auditRecord.Region = _auditableBean.Region
    }
  }

}