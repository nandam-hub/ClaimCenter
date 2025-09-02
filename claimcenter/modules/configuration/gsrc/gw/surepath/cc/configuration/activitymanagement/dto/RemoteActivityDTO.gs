package gw.surepath.cc.configuration.activitymanagement.dto

uses gw.surepath.suite.configuration.annotation.IncludeInDocumentation

class RemoteActivityDTO {

  private var _patternCode      : String                  as PatternCode
  private var _description      : String                  as Description
  private var _destApplication  : CrossAppActivityDest_SP as DestinationApplication
  private var _approvalIssue    : String                  as ApprovalIssue
  private var _accountNumber    : String                  as AccountNumber
  private var _policyNumber     : String                  as PolicyNumber
  private var _termNumber       : String                  as TermNumber
  private var _asOfDate         : Date                    as AsOfDate

  /**
   * Works like a constructor. Should be used to instantiate a RemoteActivityDTO
   * @param patternCode
   * @param description
   * @param destApp
   * @param approvalIssue
   * @param accountNum
   * @param policyNum
   * @param termNumber
   * @param asOfDate
   * @return RemoteActivityDTO
   */
  @IncludeInDocumentation
  static function valueOf(patternCode: String, description: String, destApp: CrossAppActivityDest_SP,
                                    approvalIssue: String, accountNum: String, policyNum: String,
                                    termNumber: String, asOfDate: Date) : RemoteActivityDTO {
    return new RemoteActivityDTO().readFrom(patternCode, description, destApp, approvalIssue,
        accountNum, policyNum, termNumber, asOfDate)
  }

  /**
   * Make this constructor private to force usage of the valueOf(Activity) function to instantiate this object
   */
  @IncludeInDocumentation
  private construct() {

  }

  /**
   * Used within the valueOf function to set values on this object
   * @param patternCode
   * @param description
   * @param destApp
   * @param approvalIssue
   * @param accountNum
   * @param policyNum
   * @param termNumber
   * @param asOfDate
   * @return RemoteActivityDTO
   */
  @IncludeInDocumentation
  final function readFrom(patternCode: String, description: String, destApp: CrossAppActivityDest_SP,
                                    approvalIssue: String, accountNum: String, policyNum: String,
                                    termNumber: String, asOfDate: Date) : RemoteActivityDTO {
    readFromCommon(patternCode, description, destApp, approvalIssue)
    _accountNumber = accountNum
    _policyNumber = policyNum
    _termNumber = termNumber
    _asOfDate = asOfDate
    return this
  }

  /**
   * On the RemoteActivityDTO, sets the values: _patternCode, _description, _destApplication, _approvalIssue
   * @param patternCode
   * @param description
   * @param destApp
   * @param approvalIssue
   */
  @IncludeInDocumentation
  final function readFromCommon(patternCode: String, description: String,
                                destApp: CrossAppActivityDest_SP, approvalIssue: String) {
    _patternCode = patternCode
    _description = description
    _destApplication = destApp
    _approvalIssue = approvalIssue
  }

  /**
   * On the RemoteActivityDTO, sets the _accountNumber to val
   * Sets these to null: _policyNumber, _asOfDate, _termNumber
   * @param val
   */
  @IncludeInDocumentation
  property set AccountNumber(val: String) {
    _accountNumber = val
    _policyNumber = null
    _termNumber = null
    _asOfDate = null
  }

  /**
   * On the RemoteActivityDTO, sets the _policyNumber to val
   * Sets these to null: _accountNumber
   * @param val
   */
  @IncludeInDocumentation
  property set PolicyNumber(val: String) {
    _policyNumber = val
    _accountNumber = null
  }

  /**
   * On the RemoteActivityDTO, sets the _termNumber to val
   * Sets these to null: _accountNumber, _asOfDate
   * @param val
   */
  @IncludeInDocumentation
  property set TermNumber(val: String) {
    _termNumber = val
    _accountNumber = null
    _asOfDate = null
  }

  /**
   * On the RemoteActivityDTO, sets the _asOfDate to val
   * Sets these to null: _accountNumber, _policyNumber, _termNumber
   * @param val
   */
  @IncludeInDocumentation
  property set AsOfDate(val: Date) {
    _asOfDate = val
    _accountNumber = null
    _policyNumber = null
    _termNumber = null
  }



}