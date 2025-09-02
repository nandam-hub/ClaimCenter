package gw.suites

uses gw.api.test.CCUnitTestClassBase
uses gw.api.test.SuiteBuilder
uses junit.framework.Test

@Export
class ManagedS3OutboundConfigUnitSuite {
  public static final var NAME : String = "CCManagedS3OutboundConfigUnitSuite"

  public static function suite() : Test {
    return new SuiteBuilder(CCUnitTestClassBase)
        .withSuiteName(NAME)
        .build()
  }
}