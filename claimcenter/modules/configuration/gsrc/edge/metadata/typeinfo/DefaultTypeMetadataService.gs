package edge.metadata.typeinfo

uses gw.lang.reflect.IType
uses java.lang.Iterable
uses edge.metadata.typeinfo.dto.TypeMetadataDTO
uses edge.metadata.typeinfo.typelistinfo.DefaultTypelistAnalyzer
uses edge.metadata.typeinfo.dtoinfo.DefaultDtoTypeAnalyzer
uses edge.metadata.typeinfo.typelistinfo.ITypelistAnalyzer
uses edge.metadata.typeinfo.dtoinfo.IDtoTypeAnalyzer

/** Default implementation of the type metadata service. */
final class DefaultTypeMetadataService implements  ITypeMetadataService {

  /** Default instance of the type metadata service. Could be replaced with the injectable instance so access this
   * field in constructors only.
   */
  public static final var INSTANCE: ITypeMetadataService = new DefaultTypeMetadataService(DefaultTypelistAnalyzer.INSTANCE, DefaultDtoTypeAnalyzer.INSTANCE)

  /** Analyzer for typelists. */
  private var _typelistAnalyzer : ITypelistAnalyzer

  /** Analyzer for dtos. */
  private var _dtoAnalyzer : IDtoTypeAnalyzer

  private construct(ta: ITypelistAnalyzer, da : IDtoTypeAnalyzer) {
    this._typelistAnalyzer = ta
    this._dtoAnalyzer = da
  }


  override function getMetadata(roots: Iterable<IType>): TypeMetadataDTO[] {
    return new TypeMetadataGenerator(_typelistAnalyzer, _dtoAnalyzer).getMetadata(roots)
  }
}
