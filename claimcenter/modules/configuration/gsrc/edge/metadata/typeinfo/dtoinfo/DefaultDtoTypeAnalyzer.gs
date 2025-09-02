package edge.metadata.typeinfo.dtoinfo

uses edge.masking.annotation.Masked
uses edge.metadata.typeinfo.dtoinfo.dto.DTOPropertyMetadataDTO
uses edge.metadata.typeinfo.dtoinfo.dto.MaskInfoDTO
uses gw.lang.reflect.IPropertyInfo
uses edge.metadata.typeinfo.type.TypeAnalyzer
uses edge.metadata.typeinfo.util.MetadataUtil
uses edge.metadata.typeinfo.dtoinfo.dto.DTOMetadataDTO
uses gw.lang.reflect.IType
uses gw.util.Pair
uses edge.util.MapUtil
uses java.util.Arrays
uses edge.metadata.service.IMetadataService
uses edge.metadata.service.DefaultMetadataService
uses edge.PlatformSupport.Reflection
uses edge.jsonmapper.JsonReadOnlyProperty

/**
 * Analyzer for the DTO type structure.
 */
class DefaultDtoTypeAnalyzer implements IDtoTypeAnalyzer {
  /** Instance to use before DI is implemented for the platform. */
  public static final var INSTANCE : IDtoTypeAnalyzer = new DefaultDtoTypeAnalyzer(DefaultMetadataService.SERVICE)

  /** Service used to access type metadata. */
  private var _metadataService : IMetadataService


  private construct(ms : IMetadataService) {
    this._metadataService = ms
  }

  private function populateMaskInfo(prop: IPropertyInfo) : MaskInfoDTO {
    final var mask = Reflection.getAnnotation(prop, Masked) as Masked

    if (mask == null) {
      return null
    }

    final var maskInfo = new MaskInfoDTO()
    maskInfo.IsMasked = true
    maskInfo.Pattern = mask.pattern()

    return maskInfo
  }

  /**
   * Encodes information about one property into the property metadata DTO.
   */
  private function encodeProperty(prop : IPropertyInfo) : Pair<DTOPropertyMetadataDTO, IType[]> {
    final var propType = TypeAnalyzer.encodeType(Reflection.getPropertyType(prop))
    final var res = new DTOPropertyMetadataDTO()
    res.Name = prop.Name
    res.ValueType = propType.First
    res.ReadOnly = Reflection.hasAnnotation(prop, JsonReadOnlyProperty) ? true : null
    res.Metadata = MetadataUtil.unnamedToDto(
        _metadataService.getPropertyMetadata(prop).getAllUnnamedMetadata())
    res.MaskInfo = populateMaskInfo(prop)
    return Pair.make(res, propType.Second)
  }


  /**
   * Encodes all the metadata information about the DTO type.
   */
   override public function encodeDTO(dtoType : IType) : Pair<DTOMetadataDTO, IType[]> {
    final var propMetas = _metadataService.getExposedProperties(dtoType)
        .map(\prop -> encodeProperty(prop))
    final var res = new DTOMetadataDTO()
    final var typeMeta = _metadataService.getTypeMetadata(dtoType)

    res.Properties = MapUtil.groupUnique(Arrays.asList(propMetas), \elt -> elt.First.Name, \ elt -> elt.First)
    res.NamedMetadata = MetadataUtil.namedToDto(typeMeta.getAllNamedMetadata())
    res.Metadata = MetadataUtil.unnamedToDto(typeMeta.getAllUnnamedMetadata())
    return Pair.make(res, propMetas.flatMap( \ elt -> elt.Second))
  }
}
