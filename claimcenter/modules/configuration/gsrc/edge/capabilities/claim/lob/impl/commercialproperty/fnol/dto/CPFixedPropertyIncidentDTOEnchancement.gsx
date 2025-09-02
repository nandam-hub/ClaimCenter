package edge.capabilities.claim.lob.impl.commercialproperty.fnol.dto

uses edge.capabilities.currency.dto.AmountDTO
uses gw.api.financials.CurrencyAmount
uses gw.api.util.CurrencyUtil

enhancement CPFixedPropertyIncidentDTOEnchancement: CPFixedPropertyIncidentDTO {
  static function fromFixedPropertyIncident(incident : FixedPropertyIncident) : CPFixedPropertyIncidentDTO {
    if (incident == null) {
      return null
    }
    final var res = new CPFixedPropertyIncidentDTO()
    res.PublicID = incident.PublicID
    res.Description = incident.Description
    res.PropertyDescription = incident.PropertyDesc
    res.Location = incident.Property.LocationNumber

    res.EstimateReceived = incident.EstimatesReceived
    res.EstRepairCost = incident.EstRepairCost.Amount
    res.EstRepairTime = incident.EstRepairTime
    res.EstDamage = incident.EstDamageType
    res.LossEstimate = incident.LossEstimate.Amount
    res.AlreadyRepaired = incident.AlreadyRepaired

    res.NumStories = incident.NumStories
    res.ClassType = incident.ClassType
    res.RoofMaterial = incident.RoofMaterial
    res.ExtWallMat = incident.ExtWallMat
    res.TypeOfOccupancy = incident.OccupancyType
    res.LossArea = incident.LossArea

    return res
  }

  function updateFixedPropertyIncident(claim: Claim, incident: FixedPropertyIncident) {
    incident.Description = this.Description
    incident.PropertyDesc = this.PropertyDescription
    incident.Property = claim.Policy.PolicyLocations.firstWhere(\location -> location.LocationNumber == this.Location)

    incident.EstimatesReceived = this.EstimateReceived
    incident.EstRepairCost = this.EstRepairCost == null ? null : new CurrencyAmount(this.EstRepairCost, CurrencyUtil.getDefaultCurrency())
    incident.EstRepairTime = this.EstRepairTime
    incident.EstDamageType = this.EstDamage
    incident.LossEstimate = this.LossEstimate == null ? null : new CurrencyAmount(this.LossEstimate, CurrencyUtil.getDefaultCurrency())
    incident.AlreadyRepaired = this.AlreadyRepaired

    incident.NumStories = this.NumStories
    incident.ClassType = this.ClassType
    incident.RoofMaterial = this.RoofMaterial
    incident.ExtWallMat = this.ExtWallMat
    incident.OccupancyType = this.TypeOfOccupancy
    incident.LossArea = this.LossArea
  }
}
