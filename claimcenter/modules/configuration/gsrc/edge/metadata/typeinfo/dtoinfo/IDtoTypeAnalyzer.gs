package edge.metadata.typeinfo.dtoinfo

uses gw.lang.reflect.IType
uses gw.util.Pair
uses edge.metadata.typeinfo.dtoinfo.dto.DTOMetadataDTO

/** DTO analyzer interface. */
interface IDtoTypeAnalyzer {
  /**
   * Encodes all the metadata information about the DTO type. Returns representation of the DTO and list of
   * referenced types.
   */
  public function encodeDTO(dtoType : IType) : Pair<DTOMetadataDTO, IType[]>

}
