package edge.webapimodel.dto

uses gw.lang.reflect.IType
uses edge.jsonmapper.JsonProperty
uses java.util.HashSet
uses edge.metadata.typeinfo.dto.TypeMetadataDTO
uses edge.metadata.typeinfo.DefaultTypeMetadataService

class WebApiModelDTO {

  var _allTypes = new HashSet<IType>()

  @JsonProperty
  property get newTypeMeta() :  TypeMetadataDTO[] {
    return DefaultTypeMetadataService.INSTANCE.getMetadata(_allTypes)
  }

  /**
   * This function has been created because the serializer doesn't work if we use property to access the private
   * _allTypes variable, because it doesn't support HashSet<IType>
   **/
  function getAllTypes(): HashSet<IType> {
    return _allTypes
  }

  function registerType (typeToRegister : IType) {
    _allTypes.add(typeToRegister)
  }

  function registerTypes(typesToRegister: HashSet<IType>) {
    _allTypes.addAll(typesToRegister)
  }
}
