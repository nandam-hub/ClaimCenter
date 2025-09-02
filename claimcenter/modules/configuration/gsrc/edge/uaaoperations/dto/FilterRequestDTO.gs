package edge.uaaoperations.dto


uses java.lang.StringBuilder
uses edge.jsonmapper.JsonProperty

class FilterRequestDTO {

  @JsonProperty
  private var filter : String as Filter

  @JsonProperty
  private var attributes : List<String> as Attributes

  @JsonProperty
  private var start: int as Start

  @JsonProperty
  private var count : int as Count

  @JsonProperty
  private var sortBy : String as SortBy

  @JsonProperty
  private var sortOrder : String as SortOrder

  construct() {}

  construct(_filter: String, _attributes: List<String>, _start: int, _count: int, _sortBy: String, _sortOrder: String) {
    filter = _filter
    attributes = _attributes
    start = _start
    count = _count
    sortBy = _sortBy
    sortOrder = _sortOrder
  }

  private var hasParams : boolean
  private var uriBuilder : StringBuilder

  function buildScimFilterUrl(baseUrl: String): String {

    uriBuilder = new StringBuilder(baseUrl)
    hasParams = false

    if (this.Attributes != null && !this.Attributes.Empty) {
      addToUriBuilder("attributes",this.Attributes.join(","))
    }
    if (this.Filter.HasContent) {
      addToUriBuilder("filter",this.Filter)
    }
    if (this.Start > 0) {
      addToUriBuilder("startIndex",this.Start)
    }
    if (this.Count > 0) {
      addToUriBuilder("count",this.Count)
    }
    if (this.sortOrder.HasContent) {
      addToUriBuilder("sortOrder",this.SortOrder)
    }
    if (this.sortBy.HasContent) {
      addToUriBuilder("sortBy",this.SortBy)
    }
    return uriBuilder.toString()
  }

  private function addToUriBuilder<K>(parameterName :String, toAppend : K){
    if (hasParams) {
      uriBuilder.append("&")
    }
    else {
      uriBuilder.append("?")
    }
    uriBuilder.append(parameterName).append("=").append(toAppend)
    hasParams = true

  }

}
