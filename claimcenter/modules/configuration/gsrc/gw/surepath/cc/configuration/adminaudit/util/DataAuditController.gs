package gw.surepath.cc.configuration.adminaudit.util

uses gw.api.database.Query
uses gw.api.locale.DisplayKey
uses pcf.UserDetailPage

/**
 * Controller class to support action links on PCFs that direct the user to the parent entity for a given audit record
 */
class DataAuditController {

  static function redirectToParentEntityPage(auditRecord: DataAudit_SP) {
    switch (typeof auditRecord) {
      case entity.ActivityPatternAudit_SP:
        pcf.ActivityPatternDetail.push(auditRecord.ActivityPattern)
        break
      case entity.AuthLimitProfileAudit_SP:
        pcf.AuthorityLimitProfileDetailPage.push(auditRecord.AuthLimitProfile)
        break
      case entity.CredentialAudit_SP:
        UserDetailPage.push(Query.make(entity.User).withFindRetired(true).compare(entity.User#Credential, Equals, auditRecord.Credential).select().AtMostOneRow)
        break
      case entity.GroupAudit_SP:
        pcf.GroupDetailPage.push(auditRecord.Group)
        break
      case entity.HolidayAudit_SP:
        pcf.HolidayDetail.push(auditRecord.Holiday)
        break
      case entity.RegionAudit_SP:
        pcf.RegionDetail.push(auditRecord.Region)
        break
      case entity.RoleAudit_SP:
        pcf.RoleDetailPage.push(auditRecord.Role)
        break
      case entity.UserAudit_SP:
        pcf.UserDetailPage.push(auditRecord.User)
        break
      default:
        //do nothing
    }
  }

  static function eligibleParentEntitiesForRedirect(): String[] {
    return {
      DisplayKey.get("SP.AdminAudit.Entity.ActivityPattern"),
      DisplayKey.get("SP.AdminAudit.Entity.AuthorityLimitProfile"),
      DisplayKey.get("SP.AdminAudit.Entity.Credential"),
      DisplayKey.get("SP.AdminAudit.Entity.Group"),
      DisplayKey.get("SP.AdminAudit.Entity.Holiday"),
      DisplayKey.get("SP.AdminAudit.Entity.Region"),
      DisplayKey.get("SP.AdminAudit.Entity.Role"),
      DisplayKey.get("SP.AdminAudit.Entity.User")
    }
  }
}