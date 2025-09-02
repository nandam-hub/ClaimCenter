package gw.api.specialhandling

uses entity.AutomatedNotificationHandler
uses gw.api.locale.DisplayKey
uses gw.entity.IEntityType
uses gw.lang.Export
uses gw.util.GosuStringUtil
uses typekey.NotificationType

@Export
class SpecialHandlingHelper {
  
  private construct() {}

  /**
   * In CC7.0.0, email address is a non-nullable field in the database. Our new notification methods
   * (Email by contact role, email multiple addresses) do not look at this field. Because of the DB
   * constraint, we need to populate the field with dummy data when it's not used and clear the field
   * if we re-select the OOTB notification method.
   */
  public static function refreshEmailAddressField(handler : AutomatedNotificationHandler) {
    if (handler.NotificationType == NotificationType.TC_EMAIL) {
        handler.EmailAddress = ""
    } else {
        handler.EmailAddress = "noemail@guidewire.com"
    }
  }

  public static function getAutomatedHandlerTypeLabel(automatedHandler : AutomatedHandler) : String {
    switch (typeof automatedHandler.Trigger) {
      case entity.ClaimIndicatorTrigger:
        return DisplayKey.get("Web.Admin.AutomatedHandlerBase.Category.ClaimIndicatorTrigger")
      case entity.FinancialThresholdTrigger:
        return DisplayKey.get("Web.Admin.AutomatedHandlerBase.Category.FinancialThresholdTrigger")
    }
    return GosuStringUtil.EMPTY
  }

  public static function getAccountAutomatedNotificationsAddLabel(automatedHandlerSubtype : IEntityType) : String {
    switch(automatedHandlerSubtype) {
      case entity.ClaimIndicatorAutomatedNotificationHandler:
        return DisplayKey.get("Web.Admin.AccountDetailScreen.AutomatedNotificationsAdd.MenuItemLabel.ClaimIndicatorAutomatedNotificationHandler")
      case entity.FinancialAutomatedNotificationHandler:
        return DisplayKey.get("Web.Admin.AccountDetailScreen.AutomatedNotificationsAdd.MenuItemLabel.FinancialAutomatedNotificationHandler")
    }
    return GosuStringUtil.EMPTY
  }

  public static function getServiceTierAutomatedNotificationsAddLabel(automatedHandlerSubtype : IEntityType) : String {
    switch(automatedHandlerSubtype) {
      case entity.ClaimIndicatorAutomatedNotificationHandler:
        return DisplayKey.get("Web.Admin.CustomerServiceTierDetailScreen.AutomatedNotificationsAdd.MenuItemLabel.ClaimIndicatorAutomatedNotificationHandler")
      case entity.FinancialAutomatedNotificationHandler:
        return DisplayKey.get("Web.Admin.CustomerServiceTierDetailScreen.AutomatedNotificationsAdd.MenuItemLabel.FinancialAutomatedNotificationHandler")
    }
    return GosuStringUtil.EMPTY
  }
  public static function getAccountAutomatedActivitiesAddLabel(automatedHandlerSubtype : IEntityType) : String {
    switch(automatedHandlerSubtype) {
      case entity.ClaimIndicatorAutomatedActivityHandler:
        return DisplayKey.get("Web.Admin.AccountDetailScreen.AutomatedActivitiesAdd.MenuItemLabel.ClaimIndicatorAutomatedActivityHandler")
      case entity.FinancialAutomatedActivityHandler:
        return DisplayKey.get("Web.Admin.AccountDetailScreen.AutomatedActivitiesAdd.MenuItemLabel.FinancialAutomatedActivityHandler")
    }
    return GosuStringUtil.EMPTY
  }

  public static function getServiceTierAutomatedActivitiesAddLabel(automatedHandlerSubtype : IEntityType) : String {
    switch(automatedHandlerSubtype) {
      case entity.ClaimIndicatorAutomatedActivityHandler:
        return DisplayKey.get("Web.Admin.CustomerServiceTierDetailScreen.AutomatedActivitiesAdd.MenuItemLabel.ClaimIndicatorAutomatedActivityHandler")
      case entity.FinancialAutomatedActivityHandler:
        return DisplayKey.get("Web.Admin.CustomerServiceTierDetailScreen.AutomatedActivitiesAdd.MenuItemLabel.FinancialAutomatedActivityHandler")
    }
    return GosuStringUtil.EMPTY
  }
}
