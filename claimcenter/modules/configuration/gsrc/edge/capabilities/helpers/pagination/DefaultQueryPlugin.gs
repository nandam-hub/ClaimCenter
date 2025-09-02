package edge.capabilities.helpers.pagination

uses gw.api.database.Query
uses edge.di.annotations.ForAllGwNodes
uses java.util.HashMap
uses gw.api.database.IQueryBeanResult
uses gw.api.filters.StandardQueryFilter
uses gw.lang.reflect.ReflectUtil
uses java.lang.Integer
uses edge.capabilities.helpers.pagination.dto.QueryParameterDTO
uses gw.pl.persistence.core.Bean
uses gw.lang.reflect.TypeSystem

class DefaultQueryPlugin implements IQueryPlugin {

  @ForAllGwNodes
  construct(){}

  override function runQueryOperation(aQuery: IQueryBeanResult, aQueryParameter: QueryParameterDTO): IQueryBeanResult<gw.pl.persistence.core.Bean> {
    if(aQueryParameter.IsDbProperty) {
      if(aQueryParameter.EntityName != null && aQueryParameter.EntityName.NotBlank) {
        queryOnEntity(aQuery, aQueryParameter)
      } else if(aQueryParameter.TypeListName != null && aQueryParameter.TypeListName.NotBlank) {
        queryOnTypeList(aQuery, aQueryParameter)
      }  else if(aQueryParameter.PropertyName != null && aQueryParameter.PropertyName.NotBlank) {
        queryOnProperty(aQuery, aQueryParameter)
      }
    }

    return aQuery
  }

  override function runQueryOperation(aQuery: IQueryBeanResult<gw.pl.persistence.core.Bean>, queryParameters: QueryParameterDTO[]): IQueryBeanResult<gw.pl.persistence.core.Bean> {
    var dbQueryParameters = queryParameters.where( \ aQueryParameter -> aQueryParameter.IsDbProperty)

    queryOnEntity(aQuery, dbQueryParameters.where( \ aQueryParameter -> aQueryParameter.EntityName != null && aQueryParameter.EntityName.NotBlank))
    queryOnTypeList(aQuery, dbQueryParameters.where( \ aQueryParameter -> aQueryParameter.TypeListName != null && aQueryParameter.TypeListName.NotBlank))
    queryOnProperty(aQuery, dbQueryParameters.where( \ aQueryParameter -> aQueryParameter.PropertyValue != null && aQueryParameter.PropertyValue.NotBlank))


    return aQuery
  }

  override function queryNonDbProperties(anEntity: Object, aQueryParameter: QueryParameterDTO) : boolean{
    var propertyMatch = true

    var prop = ReflectUtil.getProperty(anEntity, aQueryParameter.PropertyName)
    if(prop typeis String){
      propertyMatch = aQueryParameter.PropertyValue.contentEquals(prop)
    }else if(prop typeis Integer){
      propertyMatch = Integer.getInteger(aQueryParameter.PropertyValue) == prop
    }else if(prop typeis Boolean){
      propertyMatch = Boolean.getBoolean(aQueryParameter.PropertyValue) == prop
    }else{
      propertyMatch = aQueryParameter.PropertyValue == prop
    }

    return propertyMatch
  }

  override function queryNonDbProperties(anEntity: Object, queryParameters: QueryParameterDTO[]) : boolean{
    return queryParameters.allMatch( \ aQueryParam -> queryNonDbProperties(anEntity, aQueryParam))
  }

  protected function queryOnEntity(aQuery: IQueryBeanResult<gw.pl.persistence.core.Bean>, aQueryParameter: QueryParameterDTO) : IQueryBeanResult<gw.pl.persistence.core.Bean>{
    var entityType = TypeSystem.getByFullNameIfValid("entity." + aQueryParameter.EntityName)
    var queryEntity = Query.make(entityType as Type<KeyableBean>).compare("PublicID", Equals, aQueryParameter.EntityPublicId).select().first()
    var queryFilter = new StandardQueryFilter("", \ query -> query.compare(aQueryParameter.PropertyName, Equals, queryEntity))

    aQuery.addFilter(queryFilter)

    return aQuery
  }

  protected function queryOnEntity(aQuery: IQueryBeanResult<gw.pl.persistence.core.Bean>, queryParameters: QueryParameterDTO[]) : IQueryBeanResult<gw.pl.persistence.core.Bean>{
    var orQueryParameters = queryParameters.where( \ aQueryParam -> aQueryParam.OrOperation)
    var orParameters = new HashMap<Object, String>()

    orQueryParameters.each( \ aQueryParam -> {
      var entityType = TypeSystem.getByFullNameIfValid("entity." + aQueryParam.EntityName)
      var queryEntity = Query.make(entityType as Type<KeyableBean>).compare("PublicID", Equals, aQueryParam.EntityPublicId).select().first()
      orParameters.put(queryEntity, aQueryParam.PropertyName)
    })

    var orQueryFilter = new StandardQueryFilter("", \ query -> {
      query.or( \ orCriteria -> {
        orParameters.eachKeyAndValue( \ aKey, aValue -> {
          orCriteria.compare(aValue, Equals, aKey)
        })
      })
    })

    aQuery.addFilter(orQueryFilter)

    queryParameters.subtract(orQueryParameters).each( \ aQueryParam -> {
      queryOnEntity(aQuery, aQueryParam)
    })

    return aQuery
  }

  protected function queryOnTypeList(aQuery: IQueryBeanResult<gw.pl.persistence.core.Bean>, aQueryParameter: QueryParameterDTO) : IQueryBeanResult<gw.pl.persistence.core.Bean>{
    var typeList = TypeSystem.getByFullName("typekey." + aQueryParameter.TypeListName) as gw.entity.ITypeList
    var typeKey = typeList.getTypeKey(aQueryParameter.TypeKeyCode)
    var queryFilter = new StandardQueryFilter("", \ query -> {
      query.compare(aQueryParameter.PropertyName, Equals, typeKey)
    })

    aQuery.addFilter(queryFilter)

    return aQuery
  }

  protected function queryOnTypeList(aQuery: IQueryBeanResult<gw.pl.persistence.core.Bean>, queryParameters: QueryParameterDTO[]) : IQueryBeanResult<gw.pl.persistence.core.Bean>{
    var orQueryParameters = queryParameters.where( \ aQueryParam -> aQueryParam.OrOperation)
    var orParameters = new HashMap<Object, String>()

    orQueryParameters.each( \ aQueryParam -> {
      var typeList = TypeSystem.getByFullName("typekey." + aQueryParam.TypeListName) as gw.entity.ITypeList
      var typeKey = typeList.getTypeKey(aQueryParam.TypeKeyCode)
      orParameters.put(typeKey, aQueryParam.PropertyName)
    })

    var orQueryFilter = new StandardQueryFilter("", \ query -> {
      query.or( \ orCriteria -> {
        orParameters.eachKeyAndValue( \ aKey, aValue -> {
          orCriteria.compare(aValue, Equals, aKey)
        })
      })
    })

    aQuery.addFilter(orQueryFilter)

    queryParameters.subtract(orQueryParameters).each( \ aQueryParam -> {
      queryOnTypeList(aQuery, aQueryParam)
    })

    return aQuery
  }

  protected function queryOnProperty(aQuery: IQueryBeanResult<gw.pl.persistence.core.Bean>, aQueryParameter: QueryParameterDTO) : IQueryBeanResult<gw.pl.persistence.core.Bean>{
    var queryFilter = new StandardQueryFilter("", \ query -> {
      query.compare(aQueryParameter.PropertyName, Equals, aQueryParameter.PropertyValue)
    })

    aQuery.addFilter(queryFilter)

    return aQuery
  }

  protected function queryOnProperty(aQuery: IQueryBeanResult<gw.pl.persistence.core.Bean>, queryParameters: QueryParameterDTO[]) : IQueryBeanResult<gw.pl.persistence.core.Bean>{
    var orQueryParameters = queryParameters.where( \ aQueryParam -> aQueryParam.OrOperation)
    var orParameters = new HashMap<Object, String>()

    orQueryParameters.each( \ aQueryParam -> {
      orParameters.put(aQueryParam.PropertyValue, aQueryParam.PropertyName)
    })

    var orQueryFilter = new StandardQueryFilter("", \ query -> {
      query.or( \ orCriteria -> {
        orParameters.eachKeyAndValue( \ aKey, aValue -> {
          orCriteria.compare(aValue, Equals, aKey)
        })
      })
    })

    aQuery.addFilter(orQueryFilter)

    queryParameters.subtract(orQueryParameters).each( \ aQueryParam -> {
      queryOnProperty(aQuery, aQueryParam)
    })

    return aQuery
  }

}
