package parametric.batch.dto

class ClaimContactAttributesDTO {
  private var _firstName : String as firstName
  private var _lastName : String as lastName
  private var _contactSubtype : String as contactSubtype

  private var _addressLine1 : String as addressLine1
  private var _city : String as city
  private var _county : String as county
  private var _postalCode :String as postalCode
  private var _state : StateDTO as state

  construct(firstName1 : String, lastName1 : String, contactSubtype1 : String, addressLine : String, county1 : String, city1 : String, postalCode1 : String, state1 : StateDTO) {
    _firstName = firstName1
    _lastName = lastName1
    _contactSubtype = contactSubtype1
    _addressLine1 = addressLine
    _county = county1
    _city = city1
    _postalCode = postalCode1
    _state = state1
  }
}