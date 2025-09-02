package edge.capabilities.servicerequest.history

uses edge.capabilities.servicerequest.history.dto.ServiceRequestChangeDTO
uses edge.di.annotations.ForAllGwNodes
uses edge.util.mapping.Mapper
uses edge.security.authorization.IAuthorizerProviderPlugin

class DefaultServiceRequestChangePlugin implements IServiceRequestChangePlugin {

  /**
   * Plugin to convert service request history objects.
   */
  private var _mapper : Mapper as readonly Mapper

  @ForAllGwNodes
  construct(authzProvider:IAuthorizerProviderPlugin) {
    this._mapper = new Mapper(authzProvider)
  }

  /**
   * Converts change into DTO <em>without</em> checking authorities.
   */
  protected function toDTOImpl(src: ServiceRequestChange): ServiceRequestChangeDTO {
    final var dto = new ServiceRequestChangeDTO()
    dto.Description = src.Description
    dto.Initiator = src.Initiator.DisplayName
    dto.Sequence = src.Sequence
    dto.Timestamp = src.Timestamp

    return dto
  }

  override function mapHistory(srcs :ServiceRequestChange[]) : ServiceRequestChangeDTO[]{
    return Mapper.mapArray(srcs,\ c -> toDTOImpl(c))
  }
}
