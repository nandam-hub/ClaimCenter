package gw.surepath.cc.configuration.catastrophe.util

uses gw.api.properties.RuntimePropertyRetriever
uses gw.surepath.suite.configuration.annotation.IncludeInDocumentation

uses java.util.concurrent.locks.ReentrantLock

/**
 * Implementation of runtime properties retriever for the Proactive Catastrophe Management SurePath Content feature
 */
@IncludeInDocumentation
class CatastropheProperties {

  private var _propertyRetriever = new RuntimePropertyRetriever(RuntimePropertyGroup.TC_CATASTROPHE_SP)

  private static var _lock = new ReentrantLock()
  private static var _instance : CatastropheProperties

  private construct(){}

  /**
   * Provides access to a single instance of this class
   *
   * @return an Instance of this class
   */
  @IncludeInDocumentation
  public static property get INSTANCE() : CatastropheProperties {
    if (_instance == null) {
      using (_lock) {
        if (_instance == null) {
          _instance = new CatastropheProperties()
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

}