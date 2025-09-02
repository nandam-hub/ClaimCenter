package gw.suites

uses gw.api.test.CCServerTestClassBase
uses gw.api.test.SuiteBuilder
uses junit.framework.Test

@Export
class CCExampleServerSuite {

  public static final var NAME : String = "CCExampleServerSuite"

  public static function suite() : Test {
    return new SuiteBuilder(CCServerTestClassBase)
        .withSuiteName(NAME)
        .build()
  }

}