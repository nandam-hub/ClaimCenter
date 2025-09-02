package gw.suites.surepath.integration

uses gw.api.test.SuiteBuilder
uses junit.framework.Test

@Export
class SurePathIntegrationSuite {
  public static final var NAME : String = "SurePathIntegrationSuite"

  public static function suite() : Test {
    return new SuiteBuilder(SurePathIntegrationTestBase).withSuiteName(NAME).build()
  }
}