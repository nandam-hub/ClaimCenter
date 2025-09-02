package edge.capabilities.claim.lob.impl.commercialproperty.fnol.policy

uses edge.capabilities.claim.fnol.dto.FnolDTO
uses edge.capabilities.claim.lob.fnol.policy.ILobPolicySummaryPlugin
uses edge.capabilities.claim.lob.impl.commercialproperty.fnol.dto.PropertyRiskUnitDTO
uses edge.capabilities.claim.lob.impl.commercialproperty.fnol.policy.dto.CPPolicySummaryExtensionDTO
uses edge.di.annotations.InjectableNode
uses edge.security.authorization.IAuthorizerProviderPlugin
uses edge.util.mapping.Mapper

class CPPolicySummaryPlugin implements ILobPolicySummaryPlugin<CPPolicySummaryExtensionDTO> {

  private var _mapper: Mapper as Mapper

  @InjectableNode
  construct(authzProvider: IAuthorizerProviderPlugin) {
    this._mapper = new Mapper(authzProvider)
  }

  override function toDTO(policySummary: PolicySummary): CPPolicySummaryExtensionDTO {
    if (policySummary.PolicyType != PolicyType.TC_COMMERCIALPROPERTY) {
      return null
    }

    var res = new CPPolicySummaryExtensionDTO()
    res.PropertyRiskUnits = Mapper
        .mapArray(policySummary.Properties, \v -> propertyToDTO(v))
        .orderBy(\ru -> ru.PolicySystemId).toTypedArray()

    return res
  }

  protected function propertyToDTO(p: PolicySummaryProperty): PropertyRiskUnitDTO {
    var res = new PropertyRiskUnitDTO()

    res.LocationNumber = p.Location
    res.PolicySystemId = p.PolicySystemId
    res.BuildingNumber = p.BuildingNumber
    res.Description = p.Description
    res.AddressLine1 = p.AddressLine1
    res.AddressLine1Kanji = p.AddressLine1Kanji
    res.AddressLine2 = p.AddressLine2
    res.AddressLine2Kanji = p.AddressLine2Kanji
    res.City = p.City
    res.CityKanji = p.CityKanji

    return res
  }

  override function selectPolicySummaryRiskUnits(policySummary: PolicySummary, fnolDto: FnolDTO) {
    if (policySummary.PolicyType != PolicyType.TC_COMMERCIALPROPERTY) {
      return
    }

    var riskUnits = fnolDto.Policy.Lobs.CommercialProperty.PropertyRiskUnits?.map(\ru -> {return ru.PolicySystemId})

    if (riskUnits != null && riskUnits.HasElements && policySummary.Properties.HasElements) {
      policySummary.Properties.each(\p -> {
        if (riskUnits.hasMatch(\aRiskUnit -> aRiskUnit == p.PolicySystemId)) {
          p.Selected = true
        }
      })
    }
  }

  override function haveRiskUnitsChanged(policy: Policy, fnolDto: FnolDTO): boolean {
    if (policy.PolicyType != PolicyType.TC_COMMERCIALPROPERTY) {
      return false
    }

    var riskUnits = fnolDto.Policy.Lobs.CommercialProperty.PropertyRiskUnits?.map(\ru -> ru.PolicySystemId)

    //Check if added or removed riskunits
    if(policy.Properties?.Count != riskUnits?.length) {
      return true
    } else {
      //numbers match, check if ids match as well
      return riskUnits?.hasMatch(\ru -> policy.Properties.firstWhere(\pr -> ru == pr.PolicySystemId) == null)
    }
  }
}
