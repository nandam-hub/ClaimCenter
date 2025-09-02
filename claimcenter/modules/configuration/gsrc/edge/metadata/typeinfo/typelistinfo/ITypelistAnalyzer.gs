package edge.metadata.typeinfo.typelistinfo

uses gw.entity.ITypeList
uses gw.util.Pair
uses edge.metadata.typeinfo.typelistinfo.dto.TypelistMetadataDTO
uses gw.lang.reflect.IType

/** Typelist analyzer plugin. */
interface ITypelistAnalyzer {

  /**
   * Describes a typelist and provides information about it.
   * @returns typelist metadata DTO and list of other referenced types.
   */
  public function describeTypelist(typelist : ITypeList) : Pair<TypelistMetadataDTO, IType[]>
}
