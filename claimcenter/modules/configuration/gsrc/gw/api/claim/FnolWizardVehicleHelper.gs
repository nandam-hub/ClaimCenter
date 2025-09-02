package gw.api.claim

uses com.google.common.collect.Sets

uses java.util.IdentityHashMap
uses java.util.Map
uses java.util.HashMap

@Export
class FnolWizardVehicleHelper
{
  private final var _newClaimWizardInfo: NewClaimWizardInfo
  /**
   * Set of available vehicles
   */
  private var _policyVehicleMap: IdentityHashMap<Vehicle, FnolNewVehicle>
  
  /**
   * Flag indicating that auto-selection of vehicles for vehicle incident
   * creation in "Basic Info" step has taken place (applies to commercial
   * auto only)
   */
  private var _autoSelectFlag : boolean
  
  construct(newClaimWizardInfo: NewClaimWizardInfo) {
    _policyVehicleMap = new IdentityHashMap<Vehicle, FnolNewVehicle>();
    _autoSelectFlag = false
    _newClaimWizardInfo = newClaimWizardInfo
  }

  public property set AutoSelectedMarker(b: boolean) {
    _autoSelectFlag = b
  }
  
  public property get AutoSelectedMarker() : boolean {
    return _autoSelectFlag
  }
  
  public function resetVehicles() {
    _policyVehicleMap.clear()
  }
  
  public function getVehicles(claim : Claim) : FnolNewVehicle[] {
    // Clear out vehicles currently stashed away
    resetVehicles()
    
    // build the list of avaiable vehicles (stashed inside helper
    // wrappers)
    initVehicleIncidents(claim)

    // fetch that list of vehicles and return them
    // in an array
    var vehicleCollection = _policyVehicleMap.values()
    return vehicleCollection.toTypedArray()
  }

  public function syncVehicleIncidents(claim : Claim) {
    var exisitingVehicleToIncident = getIncidentsForVehiclesUnderPolicy(claim)
    var selectedVehicles = this.SelectedVehicles.keySet()
    var exisitingVehicles = exisitingVehicleToIncident.keySet()

    Sets.difference(selectedVehicles, exisitingVehicles)
      .each(\vehicle -> createIncident(vehicle, claim))

    Sets.difference(exisitingVehicles, selectedVehicles)
        .each(\vehicle -> removeIncident(exisitingVehicleToIncident.get(vehicle), claim))
  }

  private function createIncident(vehicle: Vehicle, claim: Claim) {
    var newIncident = new VehicleIncident(claim.getBundle())
    newIncident.Vehicle = vehicle
    claim.addToIncidents(newIncident)
  }

  private function removeIncident(incident: Incident, claim: Claim) {
    claim.removeFromIncidents(incident)
    incident.Exposures.each(\exp -> _newClaimWizardInfo.removeExposure(exp))
    gw.api.claim.FnolServiceRequestHelper.removeIncidentServiceRequests(incident)
  }

  private function getIncidentsForVehiclesUnderPolicy(claim: Claim): Map<Vehicle, VehicleIncident> {
    var vehicleToIncident = new HashMap<Vehicle, VehicleIncident>()
    claim.VehicleIncidentsOnly
        .where(\vi -> _policyVehicleMap.containsKey(vi.Vehicle))
        .each(\vi -> vehicleToIncident.put(vi.Vehicle, vi))

    return vehicleToIncident
  }
  
  private property get SelectedVehicles() : Map<Vehicle, FnolNewVehicle> {
    var vehicleCollection = _policyVehicleMap.values()
    var result = new HashMap<Vehicle, FnolNewVehicle>()

    // for each checked vehicle, put that vehicle in our
    // set of results to return
    vehicleCollection.each( \ nfv -> {
      if (nfv.Checked) {
        result.put(nfv.Vehicle, nfv)
      }
    })
    
    return (result)
  }
  
  private function initVehicleIncidents(claim : Claim) {
    
    // add all vehicles covered in our policy
    var coveredVehicles = claim.Policy.Vehicles
    coveredVehicles.each( \ cv -> addVehicle( cv ) )

    // get a set of only vehicle incidents
    var existingVehicleIncidents = claim.VehicleIncidentsOnly
    
    // for each vehicle incident, if the that vehicle is not marked (checked),
    // mark that vehicle
    existingVehicleIncidents.each( \ evi -> {
      var newFnolVehicle = _policyVehicleMap.get(evi.Vehicle)
      if (newFnolVehicle != null && !newFnolVehicle.Checked) {
          newFnolVehicle.Checked = true
        }
    })       
  }
  
  private function addVehicle(vehicleRiskUnit : VehicleRU) {
    if ( !_policyVehicleMap.containsKey(vehicleRiskUnit.Vehicle) ) {
      _policyVehicleMap.put(vehicleRiskUnit.Vehicle, new FnolNewVehicle(vehicleRiskUnit))
    }
  }     
}
