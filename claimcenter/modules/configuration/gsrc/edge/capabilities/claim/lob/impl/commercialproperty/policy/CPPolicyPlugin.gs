package edge.capabilities.claim.lob.impl.commercialproperty.policy

uses edge.capabilities.address.IAddressPlugin
uses edge.capabilities.claim.lob.impl.commercialproperty.fnol.dto.LocationDTO
uses edge.capabilities.claim.lob.impl.commercialproperty.policy.dto.CPPolicyExtensionDTO
uses edge.capabilities.claim.lob.impl.commercialproperty.fnol.dto.PropertyRiskUnitDTO
uses edge.capabilities.claim.lob.policy.ILobPolicyPlugin
uses edge.di.annotations.InjectableNode

/**
 * Homeowner LOB policy extension plugin.
 */
class CPPolicyPlugin implements ILobPolicyPlugin <CPPolicyExtensionDTO> {

  private var _addressPlugin : IAddressPlugin

  @InjectableNode
  construct(addressPlugin : IAddressPlugin) {
    _addressPlugin = addressPlugin
  }

  override function toDTO(policy : Policy) : CPPolicyExtensionDTO {
    if (policy.PolicyType != PolicyType.TC_COMMERCIALPROPERTY) {
      return null
    }

    var res = new CPPolicyExtensionDTO();
    res.PropertyRiskUnits = policy.RiskUnits.map(\riskUnit -> riskUnitToDto(riskUnit))
    res.Locations = policy.PolicyLocations
        .where(\location -> policy.RiskUnits.hasMatch(\ru -> (ru as LocationBasedRU).PolicyLocation == location))
        .map(\location -> locationToDto(location))

    return res
  }

  private function riskUnitToDto(riskUnit: RiskUnit): PropertyRiskUnitDTO {
    var riskUnitDto = new PropertyRiskUnitDTO();
    riskUnitDto.PolicySystemId = riskUnit.PolicySystemId
    riskUnitDto.Description = riskUnit.Description
    riskUnitDto.LocationNumber = (riskUnit as LocationBasedRU).PolicyLocation.LocationNumber
    riskUnitDto.BuildingNumber = (riskUnit as LocationBasedRU).Building.BuildingNumber
    riskUnitDto.Address = (riskUnit as LocationBasedRU).PolicyLocation.Address.DisplayName

    return riskUnitDto
  }

  private function locationToDto(location: PolicyLocation): LocationDTO {
    var locationDto = new LocationDTO();
    locationDto.PublicID = location.PublicID
    locationDto.Address = _addressPlugin.toDto(location.Address)
    locationDto.Number = location.LocationNumber

    return locationDto
  }

}
