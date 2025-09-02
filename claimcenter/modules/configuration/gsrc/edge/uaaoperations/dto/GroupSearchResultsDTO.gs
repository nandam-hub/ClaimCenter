package edge.uaaoperations.dto

uses edge.jsonmapper.JsonProperty

class GroupSearchResultsDTO {

  construct() {}

  construct(_resources: ScimGroupDTO[], _startIndex: int, _itemsPerPage: int, _totalResults: int) {
      this.resources = _resources
      this.startIndex = _startIndex
      this.itemsPerPage = _itemsPerPage
      this.totalResults = _totalResults
  }

  @JsonProperty
  private var resources:ScimGroupDTO[] as Resources

  @JsonProperty
  private var startIndex: int as StartIndex

  @JsonProperty
  private var itemsPerPage: int as ItemsPerPage

  @JsonProperty
  private var totalResults: int as TotalResults

}
