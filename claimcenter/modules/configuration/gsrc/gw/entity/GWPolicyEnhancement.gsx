package gw.entity

uses gw.config.LOBAbstraction

@Export
enhancement GWPolicyEnhancement : entity.Policy {
  /**
   * Helper method to create a new PolicyLocation and associate it with the Policy
   */
  function createNewPolicyLocation() : PolicyLocation{
    var newPolicyLocation = new PolicyLocation()
    this.addToPolicyLocations(newPolicyLocation)
    return newPolicyLocation
  }

  function createNewBuilding(RU : LocationBasedRU)  : Building {
    var newBuilding = new Building()
    RU.Building = newBuilding
    RU.PolicyLocation.addToBuildings(newBuilding)
    return newBuilding
  }

  function removeBuilding(RU : LocationBasedRU){
    var building = RU.Building
    RU.PolicyLocation.removeFromBuildings(building)
    RU.Building = null
  }

  //checks that all combinations of risk unit numbers and their types are unique
  function hasValidRiskUnits() : boolean {
    //gets all location based risks from all locations
    var allLocationBasedRisks = this.PolicyLocations.toList().arrays("LocationBasedRisks").toArray(new LocationBasedRU[0])
    //finds any with duplicate number and subtype from the list
    return allLocationBasedRisks.partition(\ ru -> ru.RUNumber + "|" + ru.Subtype).filterByValues(\ l -> l.Count > 1).Empty
  }
  
  /**
   * @return true if this Policy is a Homeowner's policy.
   */
  property get HomeownersPolicy() : boolean {
    return LOBAbstraction.ForPolicy.isHomeownersPolicy(this)
  }

}
