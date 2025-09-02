package edge.metadata.typeinfo.typelistinfo

uses gw.entity.TypeKey
uses edge.metadata.typeinfo.typelistinfo.dto.TypeCodeCategoryMetadataDTO
uses edge.metadata.typeinfo.typelistinfo.dto.TypeCodeMetadataDTO
uses edge.metadata.typeinfo.typelistinfo.dto.TypelistFilterMetadataDTO
uses gw.api.domain.TypeKeyFilter
uses gw.entity.ITypeList
uses edge.metadata.typeinfo.typelistinfo.dto.TypelistMetadataDTO
uses gw.lang.reflect.IType
uses gw.util.Pair
uses edge.metadata.typeinfo.util.MetadataUtil
uses edge.metadata.service.IMetadataService
uses edge.metadata.service.DefaultMetadataService

/**
 * Utilities used to analyze and generate typelist metadata.
 * This utility class does not follow plugin architecture yet, but this could be improved in the future versions if we
 * get enough support requests.
 * <p>This implementation does not provide any typekey filtering (i.e. all typekeys and filters are exposed in the
 *   typelist, all related categories are exposed, etc...).
 * </p>
 */
final class DefaultTypelistAnalyzer implements  ITypelistAnalyzer {

  /** The only instance of the typelist analyzer. */
  public static final var INSTANCE : ITypelistAnalyzer = new DefaultTypelistAnalyzer(DefaultMetadataService.SERVICE)

  /** Metadata access service. */
  private var _metadataService : IMetadataService

  private construct(ms : IMetadataService) {
    this._metadataService = ms
  }

  /**
   * Describes a category relationship using DTO terms.
   */
  public static function describeCategory(category : TypeKey) : Pair<TypeCodeCategoryMetadataDTO, IType> {
    final var categoryType = typeof category
    final var res = new TypeCodeCategoryMetadataDTO ()
    res.Typelist = categoryType.RelativeName
    res.Typecode = category.Code
    return Pair.make(res, categoryType)
  }

  /**
   * Describes a one typekey. This implementation adds all the categories of the related typelists.
   */
  public static function describeCode(key : TypeKey) : Pair<TypeCodeMetadataDTO, IType[]> {
    final var catMeta = key.Categories.map(\c -> describeCategory(c))

    final var res = new TypeCodeMetadataDTO()
    res.Code = key.Code
    res.Priority = key.Priority
    res.DisplayKey = "typekey.${key.IntrinsicType.RelativeName}.${key.Code}"
    res.Categories = catMeta.map( \ elt -> elt.First)
    return Pair.make(res, catMeta.map( \ elt -> elt.Second))
  }

  /**
   * Describes a type filter.
   * @param typelist typelist defining all available values. This typelist would be used to get all the available
   * values.
   * @param filter typelist filter to describe.
   */
  public static function describeFilter(typelist : ITypeList, filter : TypeKeyFilter) : TypelistFilterMetadataDTO {
    final var res = new TypelistFilterMetadataDTO()
    res.Name = filter.Name
    res.IncludedCodes = typelist.getTypeKeysByFilterName(filter.Name)
        .where(\code -> !code.isRetired())
        .map(\code -> code.Code)
        .toTypedArray()
    return res
  }


  /**
   * Describes a typelist and provides information about it. Returned information includes all the typecodes of the
   * typelist.
   */
  override public function describeTypelist(typelist : ITypeList) : Pair<TypelistMetadataDTO, IType[]> {
    final var codesInfo = typelist.getTypeKeys(false).map(\code -> describeCode(code)).toTypedArray()

    final var res = new TypelistMetadataDTO()
    res.Codes = codesInfo.map( \ elt -> elt.First)
    res.Filters = typelist.TypeKeyFilters.map(\ff -> describeFilter(typelist, ff)).toTypedArray()
    res.NamedMetadata =
      MetadataUtil.namedToDto(
          _metadataService.getTypeMetadata(typelist).getAllNamedMetadata())
    return Pair.make(res, codesInfo.flatMap(\ elt -> elt.Second))
  }
}
