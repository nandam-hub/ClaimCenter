package edge.capabilities.helpers.pagination


uses gw.api.database.IQueryBeanResult
uses edge.capabilities.helpers.pagination.dto.QueryParameterDTO

interface IQueryPlugin {

  public function runQueryOperation(aQuery : IQueryBeanResult, aQueryParameter : QueryParameterDTO) : IQueryBeanResult
  public function runQueryOperation(aQuery : IQueryBeanResult, queryParameters : QueryParameterDTO[]) : IQueryBeanResult
  public function queryNonDbProperties(anEntity: Object, aQueryParameter: QueryParameterDTO) : boolean
  public function queryNonDbProperties(anEntity: Object, queryParameters: QueryParameterDTO[]) : boolean

}
