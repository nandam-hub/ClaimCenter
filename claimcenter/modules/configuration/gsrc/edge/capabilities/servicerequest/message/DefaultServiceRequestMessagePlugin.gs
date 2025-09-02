package edge.capabilities.servicerequest.message

uses edge.capabilities.servicerequest.message.dto.ServiceRequestMessageDTO
uses edge.util.mapping.Mapper
uses edge.di.annotations.ForAllGwNodes
uses edge.security.authorization.IAuthorizerProviderPlugin

class DefaultServiceRequestMessagePlugin implements IServiceRequestMessagePlugin {

  private var _mapper : Mapper as readonly Mapper

  @ForAllGwNodes
  construct(authzProvider:IAuthorizerProviderPlugin) {
    this._mapper = new Mapper(authzProvider)
  }

  override function mapMessages(srms: ServiceRequestMessage[]) : ServiceRequestMessageDTO[] {
    return Mapper.mapArray(srms,\ m -> toDTOImpl(m))
  }


  /**
   * Converts request message to DTO <em>Without checking an access.</em>
   */
  protected  function toDTOImpl(srm : ServiceRequestMessage) : ServiceRequestMessageDTO{
    final var dto = new ServiceRequestMessageDTO()
    dto.PublicID = srm.PublicID
    dto.Body = srm.Body
    dto.Title = srm.Title
    dto.Author = srm.Author.DisplayName
    dto.Type = srm.Type
    dto.SendDate = srm.SendDate
    dto.ServiceRequestNumber = srm.ServiceRequest.ServiceRequestNumber
    dto.ReferenceNumber = srm.ServiceRequest.ServiceRequestReferenceNumberGw != null ?
    srm.ServiceRequest.ServiceRequestReferenceNumberGw : srm.ServiceRequest.OwningClaim.ClaimNumber

    return dto
  }
}
