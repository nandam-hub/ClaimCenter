package gw.suites.surepath.integration

uses gw.api.test.CCServerTestClassBase

/**
 * Base class for SurePath integration tests. The framework only defines product specific test base classes,
 * so this one class must be product specific by extending one of the product specific base classes:
 *   ABServerTestClassBase
 *   BCServerTestClassBase
 *   CCServerTestClassBase
 *   PCServerTestClassBase
 */
class SurePathIntegrationTestBase extends CCServerTestClassBase {

  /**
   * Construct a test.
   */
  protected construct() {super()}

  /**
   * Construct a test with the given name.
   *
   * @param name the test name.
   */
  protected construct(name : String) {super(name)}
}