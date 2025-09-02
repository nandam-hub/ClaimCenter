package parametric.batch.dto

class AutoPilotRequestDTO {

  private var _data : DataDTO as data
  private var _included : IncludedDTO as included

  construct(data1 : DataDTO, included1 : IncludedDTO) {
    _data = data1
    _included = included1
  }
}