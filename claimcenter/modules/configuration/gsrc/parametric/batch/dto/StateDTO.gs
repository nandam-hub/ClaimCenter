package parametric.batch.dto

class StateDTO {

  private var _code : String as code
  private var _name : String as name

  construct(stateCode : String, stateName : String) {
    _code = stateCode
    _name = stateName
  }
}