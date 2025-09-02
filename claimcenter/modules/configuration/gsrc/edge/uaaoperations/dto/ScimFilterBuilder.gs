package edge.uaaoperations.dto

uses java.lang.StringBuilder
uses java.net.URLEncoder

class ScimFilterBuilder {

  private var scimFilters : StringBuilder
  private var attributes: List<String>
  private var start: int
  private var count: int
  private var sortBy: String
  private var sortOrder: String


  construct () {
    this.scimFilters = new StringBuilder()
  }

  function filter(attr : String, op : ScimFilterOperator, val : String) : ScimFilterBuilder {
    scimFilters.append("${attr} ${op.filterStr} \"${val}\"")
    return this
  }

  function andFilter(attr : String, op : ScimFilterOperator, val : String) : ScimFilterBuilder {
    if (scimFilters.isEmpty()){
      return filter(attr, op, val)
    }else{
      scimFilters.append(" and ${attr} ${op.filterStr} \"${val}\"")
    }

    return this
  }

  function orFilter(attr : String, op : ScimFilterOperator, val : String) : ScimFilterBuilder {
    if (scimFilters.isEmpty()){
      return filter(attr, op, val)
    }else{
      scimFilters.append(" or ${attr} ${op.filterStr} \"${val}\"")
    }

    return this
  }

  function attributes(_attributes: List<String>): ScimFilterBuilder {

    if (_attributes != null and  !_attributes.Empty) {
      this.attributes = attributes
    }

    return this
  }

  function count(_count:int) : ScimFilterBuilder {
    this.count = _count
    return this
  }

  function start(_start:int) : ScimFilterBuilder {
    this.start = _start
    return this
  }

  function sortBy(_sortBy:String) : ScimFilterBuilder {
    this.sortBy = _sortBy
    return this
  }

  function sortOrder(_sortOrder:String) : ScimFilterBuilder {
    this.sortOrder = _sortOrder
    return this
  }

  function returnAll(): ScimFilterBuilder {
    this.start = 0
    this.count = 0
    return this
  }

  function build() : FilterRequestDTO {
    return new FilterRequestDTO(URLEncoder.encode(scimFilters.toString(), "UTF-8"), attributes, start, count, sortBy, sortOrder)
  }
}
