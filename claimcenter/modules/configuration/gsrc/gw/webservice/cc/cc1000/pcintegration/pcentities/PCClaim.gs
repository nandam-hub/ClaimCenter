package gw.webservice.cc.cc1000.pcintegration.pcentities

uses gw.api.database.Query
uses gw.api.database.Relop
uses gw.xml.ws.annotation.WsiExportable

uses java.math.BigDecimal

uses typekey.Currency

@WsiExportable("http://guidewire.com/cc/ws/gw/webservice/cc/cc1000/pcintegration/pcentities/PCClaim")
@Export
final class PCClaim {

  var _claimNumber : String as ClaimNumber
  var _claimPublicId : String as ClaimPublicID
  var _lossDate : Date as LossDate
  var _policyNumber : String as PolicyNumber
  var _policyTypeName : String as PolicyTypeName
  var _totalIncurred : BigDecimal as TotalIncurred
  var _totalIncurredCurrency : Currency as TotalIncurredCurrency
  var _remainingReserves : BigDecimal as RemainingReserves
  var _remainingReservesCurrency : Currency as RemainingReservesCurrency
  var _claimSecurityType : String as ClaimSecurityType
  var _litigationIndicator : Boolean as LitigationIndicator
  var _fraudIndicator : Boolean as FraudIndicator
  var _largeLossIndicator : Boolean as LargeLossIndicator
  var _status : String as Status
  var _lossType : String as LossType
  var _adjuster : PCAdjuster as Adjuster

  construct() {
  }

  construct(ccClaim: Claim) {
    _claimNumber = ccClaim.ClaimNumber
    _claimPublicId = ccClaim.PublicID
    _policyNumber = ccClaim.Policy.PolicyNumber
    _lossDate = ccClaim.LossDate
    _status = ccClaim.State.Description
    _policyTypeName = ccClaim.Policy.PolicyType.DisplayName
    _claimSecurityType = ccClaim.PermissionRequired.Code
    _litigationIndicator = Query.make(Matter).compare(Matter#Claim, Relop.Equals, ccClaim).select().Count > 0
    var largeLossStatus = ccClaim.LargeLossNotificationStatus
    _largeLossIndicator = largeLossStatus == LargeLossNotificationStatus.TC_INQUEUE
                          or largeLossStatus == LargeLossNotificationStatus.TC_SENT
    _fraudIndicator = ccClaim.FraudIndicator
    var tempIncurred = ccClaim.ClaimRpt.TotalIncurredNet
    if (tempIncurred != null) {
      _totalIncurred = tempIncurred.Amount
      _totalIncurredCurrency = tempIncurred.Currency
    }
    var tempReserves = ccClaim.ClaimRpt.RemainingReserves
    if (tempReserves != null) {
      _remainingReserves = tempReserves.Amount
      _remainingReservesCurrency = tempReserves.Currency
    }
    _lossType = ccClaim.LossType.DisplayName
    _adjuster = new PCAdjuster(ccClaim.AssignedUser.Contact)
  }

  construct(ccClaimInfo : ClaimInfo) {
    _claimNumber = ccClaimInfo.ClaimNumber
    _policyNumber = ccClaimInfo.PolicyNumber
    _lossDate = ccClaimInfo.LossDate
    if (ccClaimInfo.ArchiveState != null) {
      _status = ArchiveState.TC_ARCHIVED.DisplayName
    }
  }
}
