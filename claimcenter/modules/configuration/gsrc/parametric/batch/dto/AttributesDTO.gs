package parametric.batch.dto

class AttributesDTO {
  private var _policNumber : String as policyNumber
  private var _description : String as description
  private var _lossdate : String as lossDate
  private var _lossCause : CommonDTO as lossCause
  private var _lossLocation :LossLocationDTO as lossLocation
  private var _faultRating : CommonDTO as faultRating
  private var _reportedByType : CommonDTO as reportedByType
  private var _reporter : CommonDTO as reporter

  construct(policyNumber1 : String, description1 : String, lossdate1 : String, lossCause1 : CommonDTO, lossLocation1 : LossLocationDTO, faultRating1 : CommonDTO, reportedByType1 : CommonDTO, reporter1 : CommonDTO) {
    _policNumber = policyNumber1
    _description = description1
    _lossdate = lossdate1
    _lossCause = lossCause1
    _lossLocation = lossLocation1
    _faultRating = faultRating1
    _reportedByType = reportedByType1
    _reporter = reporter1
  }
}