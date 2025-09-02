package edge.metadata.typeinfo

uses java.lang.Iterable
uses gw.lang.reflect.IType
uses edge.metadata.typeinfo.dto.TypeMetadataDTO

/** Type metadata generator. */
interface ITypeMetadataService {
  public function getMetadata(roots : Iterable<IType>) : TypeMetadataDTO[]
}
