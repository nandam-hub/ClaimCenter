package gw.surepath.cc.configuration.activitymanagement.util

uses gw.api.properties.RuntimePropertyRetriever
uses gw.surepath.suite.configuration.annotation.IncludeInDocumentation

uses java.util.concurrent.locks.ReentrantLock

/**
 * Provides Access to RuntimeProperties for the Activity Management feature
 */
@IncludeInDocumentation
class ActivityManagementProperties {

  private var _propertyRetriever = new RuntimePropertyRetriever(RuntimePropertyGroup.TC_ACTMANAGEMENT_SP)

  private static var _lock = new ReentrantLock()
  private static var _instance : ActivityManagementProperties

  private construct(){}

  /**
   * Provides access to a single instance of this class
   *
   * @return an Instance of this class
   */
  @IncludeInDocumentation
  public static property get INSTANCE() : ActivityManagementProperties {
    if (_instance == null) {
      using (_lock) {
        if (_instance == null) {
          _instance = new ActivityManagementProperties()
        }
      }
    }
    return _instance
  }

  /**
   * @return Boolean indicating if this feature is enabled
   */
  @IncludeInDocumentation
  public property get FeatureEnabled() : Boolean {
    return _propertyRetriever.getBooleanProperty("Enabled")
  }

  /**
   * @return Boolean indicating if the shared activities portion of this feature is enabled
   */
  @IncludeInDocumentation
  public property get SharedActivitiesEnabled() : Boolean {
    return _propertyRetriever.getBooleanProperty("SharingEnabled")
  }

  /**
   * @return Boolean indicating if the Backup user portion of this feature is enabled
   */
  @IncludeInDocumentation
  public property get BackupUserEnabled() : Boolean {
    return _propertyRetriever.getBooleanProperty("BackupUserEnabled")
  }

}