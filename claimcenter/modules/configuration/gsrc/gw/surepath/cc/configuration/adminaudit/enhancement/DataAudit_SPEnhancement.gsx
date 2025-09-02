package gw.surepath.cc.configuration.adminaudit.enhancement

uses gw.surepath.suite.configuration.annotation.IncludeInDocumentation
uses typekey.DataAudit_SP

/**
 * Enhancement library for the custom DataAudit_SP entity
 * Entity is used to support admin audit records for non-transactional data changes
 */
@IncludeInDocumentation
enhancement DataAudit_SPEnhancement : entity.DataAudit_SP {

  /**
   * Based upon the concrete subtype of this entity,
   * this property retrieves the foreign key public ID to the associated parent record for the auditable change
   *
   * Please note that this function must be extended for new audit entity subtypes
   *
   * @return the public ID for the triggering parent entity
   */
  @IncludeInDocumentation
  property get AuditableEntityPublicID(): String {
    var publicIDReturnValue: String
    switch (this.Subtype) {
      case DataAudit_SP.TC_ACTIVITYPATTERNAUDIT_SP:
        publicIDReturnValue = (this as ActivityPatternAudit_SP).ActivityPattern.PublicID
        break
      case DataAudit_SP.TC_AUTHLIMITPROFILEAUDIT_SP:
        publicIDReturnValue = (this as AuthLimitProfileAudit_SP).AuthLimitProfile.PublicID
        break
      case DataAudit_SP.TC_CREDENTIALAUDIT_SP:
        publicIDReturnValue = (this as CredentialAudit_SP).Credential.PublicID
        break
      case DataAudit_SP.TC_GROUPAUDIT_SP:
        publicIDReturnValue = (this as GroupAudit_SP).Group.PublicID
        break
      case DataAudit_SP.TC_HOLIDAYAUDIT_SP:
        publicIDReturnValue = (this as GroupAudit_SP).Group.PublicID
        break
      case DataAudit_SP.TC_REGIONAUDIT_SP:
        publicIDReturnValue = (this as RegionAudit_SP).Region.PublicID
        break
      case DataAudit_SP.TC_ROLEAUDIT_SP:
        publicIDReturnValue = (this as RoleAudit_SP).Role.PublicID
        break
      case DataAudit_SP.TC_USERAUDIT_SP:
        publicIDReturnValue = (this as UserAudit_SP).User.PublicID
        break
      default:
        break
    }
    return publicIDReturnValue ?: this.RemovedAuditBeanID
  }

}
