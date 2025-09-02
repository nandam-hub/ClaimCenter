package gw.surepath.cc.configuration.upgrade

uses gw.api.database.upgrade.DatamodelChangeWithoutArchivedDocumentChange
uses gw.api.database.upgrade.after.AfterUpgradeVersionTrigger
uses gw.api.database.upgrade.before.BeforeUpgradeVersionTrigger
uses gw.api.datamodel.upgrade.CustomerDatamodelUpgrade
uses gw.api.datamodel.upgrade.IDatamodelChange
//uses gw.surepath.cc.configuration.icd.upgrade.ICDCodeEditionICD9Trigger
uses gw.surepath.cc.configuration.activitymanagement.upgrade.ActivityPatternAssigneeInfoUpgradeTrigger
uses gw.surepath.cc.configuration.activitymanagement.util.ActivityManagementProperties

/**
 * SurePath Content implementation for the IDataModelUpgrade plugin
 * Customer implementations should either repurpose code from this class into their own custom implementation
 * or should add custom data model upgrade triggers to this class and comment them accordingly
 */
class SurePathDataModelUpgrade extends CustomerDatamodelUpgrade {
  
  override property get BeforeUpgradeDatamodelChanges() : List<IDatamodelChange<BeforeUpgradeVersionTrigger>> {
    return {}
  }

  /**
   * Override of the after upgrade datamodel changes property
   *
   * @return a list with a single upgrade trigger in it, to update activity pattern assignee info that may be null
   */
  override property get AfterUpgradeDatamodelChanges() : List<IDatamodelChange<AfterUpgradeVersionTrigger>> {
    var list = new ArrayList<IDatamodelChange<AfterUpgradeVersionTrigger>>()
   // list.add(DatamodelChangeWithoutArchivedDocumentChange.make(new ICDCodeEditionICD9Trigger()))
    if (ActivityManagementProperties.INSTANCE.FeatureEnabled) {
      list.add(DatamodelChangeWithoutArchivedDocumentChange.make(new ActivityPatternAssigneeInfoUpgradeTrigger()))
    }
    return list
  }
}