package edge.capabilities.extusermgmt.authadminconsole.vendorlookup

uses edge.jsonmapper.JsonProperty
uses java.util.HashMap
uses java.lang.Integer

class VendorSearchCriteriaDTO {
  
  @JsonProperty
  private var _maxResults:Integer as MaxResults

  @JsonProperty
  private var _vendorType:typekey.Contact as VendorType

  @JsonProperty
  private var _firstName:String as FirstName

  @JsonProperty
  private var _lastName:String as LastName

  @JsonProperty
  private var _company:String as Company

  @JsonProperty
  private var _state:typekey.State as State
}
