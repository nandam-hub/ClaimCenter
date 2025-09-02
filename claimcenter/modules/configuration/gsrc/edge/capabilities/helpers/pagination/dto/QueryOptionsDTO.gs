package edge.capabilities.helpers.pagination.dto

uses edge.jsonmapper.JsonProperty
uses java.lang.Integer


/**
 * Holds query options for pagination enabled endpoints. Includes
 * what point to retrieve the data from (offset start) where to get
 * the data to (offset end) and the column to order by.
 */
class QueryOptionsDTO {

  @JsonProperty
  var _offsetStart : Integer as OffsetStart

  @JsonProperty
  var _offsetEnd : Integer as OffsetEnd

  @JsonProperty
  var _orderBy : String as OrderBy

  @JsonProperty
  var _orderByDescending : Boolean as OrderByDescending
}
