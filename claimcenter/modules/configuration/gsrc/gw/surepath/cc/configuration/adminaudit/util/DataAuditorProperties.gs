package gw.surepath.cc.configuration.adminaudit.util

uses gw.api.locale.DisplayKey
uses gw.api.properties.RuntimePropertyRetriever
uses gw.surepath.suite.configuration.annotation.IncludeInDocumentation

uses java.util.concurrent.locks.ReentrantLock

/**
 * Provides Access to RuntimeProperties for the Data Audit feature
 */
@IncludeInDocumentation
class DataAuditorProperties {

  private var _propertyRetriever = new RuntimePropertyRetriever(RuntimePropertyGroup.TC_DATA_AUDITOR_SP)

  private static var _lock = new ReentrantLock()
  private static var _instance : DataAuditorProperties

  private construct(){}

  /**
   * Provides access to a single instance of this class
   *
   * @return an Instance of this class
   */
  @IncludeInDocumentation
  public static property get INSTANCE() : DataAuditorProperties {
    if (_instance == null) {
      using (_lock) {
        if (_instance == null) {
          _instance = new DataAuditorProperties()
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
   * @return Boolean indicating if the current configuration allows sending audit records
   * to external systems
   */
  @IncludeInDocumentation
  public property get SendToExternalSystem(): Boolean {
    return _propertyRetriever.getBooleanProperty(DisplayKey.get("SP.AdminAudit.Messaging.SendToExternalSystem"))
  }

  /**
   * @return Integer indicating the number of days to keep audit records that are primarily stored in the
   * Internal Application database
   */
  @IncludeInDocumentation
  public property get DaysToKeepIfPrimary() : Integer {
    return _propertyRetriever.getIntegerProperty("DaysToKeepIfPrimary")
  }

  /**
   * @return Integer indicating the number of days to keep audit records when sending to a External System is enabled
   */
  @IncludeInDocumentation
  public property get DaysToKeepIfSecondary() : Integer {
    return _propertyRetriever.getIntegerProperty("DaysToKeepIfSecondary")
  }


  /**
   * @return Integer indicating the max number of search results to be returned to the UI
   */
  @IncludeInDocumentation
  public property get AdminAuditSearchResultLimit() : Integer {
    return _propertyRetriever.getIntegerProperty("AdminAuditSearchResultLimit")
  }
}