package gw.surepath.suite.integration.logging

uses gw.suites.surepath.integration.SurePathIntegrationSuite
uses gw.suites.surepath.integration.SurePathIntegrationTestBase
uses gw.testharness.v3.Suites

/**
 * GUnit tests for StructuredLogger.
 *
 * Due to the nature of logging, these tests simply output various
 * combinations of the logging APIs to the log.
 *
 * Prereqisites
 *
 *
 *
 */
@Suites(SurePathIntegrationSuite.NAME)
class StructuredLoggerTest extends SurePathIntegrationTestBase {
  private static var _subLogger = StructuredLogger.TEST.createSubcategoryLogger("ITest")
  private static var _logger = StructuredLogger.TEST // use the integration logs for output
  private static var _address : Address

  /**
   * Setup for logging tests.
   */
  public function beforeClass() {
    super.beforeClass()
    gw.transaction.Transaction.runWithNewBundle(\bundle -> {
      _address = new Address(bundle)
      _address.PublicID = "gw:123"
      _address.AddressLine1 = "2850 South Delaware Street"
      _address.City = "San Mateo"
      _address.State = State.TC_CA
      _address.Country = Country.TC_US
      _address.PostalCode = "94403"
    }, 'su')
  }

  /**
   * ITest subcategory.
   */
  public function testSubcategory() {
    assertEquals("Unexpected logger subcategory name", _subLogger.Name, "Test.ITest")
  }
  /**
   * ITest all formatting.
   */
  public function testAllFormatting() {
    _logger.info("Message", {_address, _address#City, "this is a string message"}, {"Key1" -> "Value1", "Key2" -> "Value2"}, #testAllFormatting())
  }

  /**
   * ITest method name.r2
   */
  public function testMethodName() {
    _logger.info("Message", :method = #testMethodName())
  }

  /**
   * ITest objects.
   */
  public function testObjects() {
    var str = "ITest"
    _logger.info("Message", {_address, _address#City, str, null})
  }

  /**
   * ITest parameters.
   */
  public function testErrorCode() {
    _logger.info("ErrorCodeMessage", :parameters={"Key1"->"Value1", "Key2"->"Value2","errorCode"->"ERROR00012"})
    _logger.info("ErrorCodeMessage",:errorCode="ERROR00013")
  }

  /**
   * ITest parameters.
   */
  public function testParameters() {
    _logger.info("Message", :parameters={"Key1"->"Value1", "Key2"->"Value2"})
  }

  /**
   * Test logger timing output
   */
  public function testTiming(){
    _logger.executeWithContext(\ -> doSomeAction(), {}, true)
  }

  private function doSomeAction() {
    for (1..10000){
      var s = "ssssssssssssss".trim() // kill some time
    }
    _logger.info("Test timing", :method = #testTiming())
  }

  public function testRemoveCRLF() {
    _logger.info("Message", :parameters={"Key1"->"Value1", "Key2"->"Value2"})
  }

  public function testExceptionMessage(){
    var ex = new Exception("Test Exception")
    _logger.error("Testing exception handling.", #testExceptionMessage(), ex, :parameters = {"Key1" -> "Value1", "Key2" -> "Value2"})
  }

  public function testNotPassingMethodForErrorExceptionMessage(){
    var ex = new Exception("Test Exception")
    _logger.error("Testing exception handling.", null, ex, :parameters = {"Key1" -> "Value1", "Key2"->"Value2"})
  }

  public function testStructuredLoggerPropertiesSettings(){
    _logger.info("Properties for StructuredLogger",
        :parameters={"RemoveCRLF"->_logger.isRemoveCRLF(), "LightLogging"->_logger.isLightLoggingEnabled()})
  }


}