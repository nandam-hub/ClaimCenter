package parametric.batch.dto

class LossLocationDTO {
  private var _addressLine1 : String as addressLine1
  private var _city : String as city
  private var _county : String as county
  private var _policyLabel : String as policyLabel
  private var _postalCode :String as postalCode
  private var _state : StateDTO as state

  construct(addressLine : String, cty : String, county1 : String, policyLbl : String, zipcode : String, stateDto : StateDTO) {
    _addressLine1 = addressLine
    _city = cty
    _county = county1
    _policyLabel = policyLbl
    _postalCode = zipcode
    _state = stateDto
  }
}