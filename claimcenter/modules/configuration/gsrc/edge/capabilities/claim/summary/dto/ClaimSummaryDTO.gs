package edge.capabilities.claim.summary.dto

uses edge.capabilities.currency.dto.AmountDTO
uses edge.jsonmapper.JsonProperty
uses java.util.Date
uses edge.capabilities.address.dto.AddressDTO
uses edge.capabilities.claim.contact.dto.ClaimContactDTO
uses edge.capabilities.claim.contact.dto.ContactDTO

class ClaimSummaryDTO {
  @JsonProperty 
  var _claimNumber : String as ClaimNumber
  
  @JsonProperty 
  var _publicID : String as PublicID
  
  @JsonProperty 
  var _lossDate : Date as LossDate
  
  @JsonProperty 
  var _lossType : typekey.LossType as LossType
  
  @JsonProperty 
  var _description : String as Description
  
  @JsonProperty
  var _addresses : AddressDTO[] as Addresses
  
  @JsonProperty
  var _vendors: ClaimContactDTO[] as Vendors

  @JsonProperty
  var _claimState:ClaimState as ClaimState
  
  @JsonProperty
  var _policyNumber:String as PolicyNumber
  
  @JsonProperty
  var _insuredContact:ContactDTO as InsuredContact
  
  @JsonProperty
  var _lineOfBusinessCode:String as LineOfBusinessCode

  @JsonProperty
  var _totalIncurredNet: AmountDTO as TotalIncurredNet

  @JsonProperty
  var _totalPayments: AmountDTO as TotalPayments
}
