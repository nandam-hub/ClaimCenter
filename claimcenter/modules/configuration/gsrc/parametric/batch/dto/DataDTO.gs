package parametric.batch.dto

class DataDTO {
  private var _attributes : AttributesDTO as attributes

  construct(attribute : AttributesDTO) {
    _attributes = attribute
  }
}