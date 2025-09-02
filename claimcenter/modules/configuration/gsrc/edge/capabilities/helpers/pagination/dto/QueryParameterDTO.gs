package edge.capabilities.helpers.pagination.dto


uses edge.jsonmapper.JsonProperty

class QueryParameterDTO {

  @JsonProperty
  var _propertyName : String as PropertyName

  @JsonProperty
  var _propertyValue : String as PropertyValue

  @JsonProperty
  var _isDbProperty : Boolean as IsDbProperty

  @JsonProperty
  var _typeListName : String as TypeListName

  @JsonProperty
  var _typeKeyCode : String as TypeKeyCode

  @JsonProperty
  var _entityName : String as EntityName

  @JsonProperty
  var _entityPublicId : String as EntityPublicId

  @JsonProperty
  var _orOperation : Boolean as OrOperation

}
