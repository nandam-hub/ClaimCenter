package gw.api.claim

uses gw.api.locale.DisplayKey

/**
 * Helper for Vehicle Incident occupants: Driver and Passengers
 */
@Export
class VehicleIncidentUIHelper {

  private var _vehicleIncident : VehicleIncident

  construct(vehicleIncident : VehicleIncident) {
    this._vehicleIncident = vehicleIncident
  }


  /**
   * @return list of people in the vehicle
   */
  property get VehicleOccupants() : ArrayList<Person> {

    var occupants = new ArrayList<Person>()

    var driver = this._vehicleIncident.driver
    if (driver != null) {
      occupants.add(driver)
    }

    occupants.addAll(this._vehicleIncident.passenger.toList())

    return occupants
  }

  /**
   * Based on the list of VehicleOccupants for this VehicleIncident, return the icon
   * @param occupant
   * @return Icon for this occupant which could be either Driver or Passenger
   */
  function getOccupantIcon(occupant: Person) : String {
    return _vehicleIncident.driver == occupant ? DriverIcon : PassengerIcon
  }

  /**
   * Based on the list of VehicleOccupants for this VehicleIncident, return the icon tooltip
   * @param occupant
   * @return Icon Tooltip for this occupant
   */
  function getOccupantIconTooltip(occupant: Person) : String {
    return _vehicleIncident.driver == occupant ? DriverIconTooltip : PassengerIconTooltip
  }

  /**
   * @param severity type for the injury
   * @return Icon for the type of the severity
   */
  function getOccupantSeverityIcon(severity: SeverityType) : String {
    return severity == SeverityType.TC_FATAL ? "fatality" : "injury"
  }

  /**
   * @param severity type for the injury
   * @return Icon tooltip for the type of the severity
   */
  function getOccupantSeverityIconTooltip(severity: SeverityType) : String {
    return severity ==  SeverityType.TC_FATAL ?
        DisplayKey.get("Web.NewLossDetailsScreen.VehicleIncidentIterator.Fatal.IconLabel")
        : DisplayKey.get("Web.NewLossDetailsScreen.VehicleIncidentIterator.Injured.IconLabel")
  }

  /**
   * @param occupant
   * @return role of the occupant in this VehicleIncident
   */
  function getOccupantRole(occupant: Person) : ContactRole {
    return _vehicleIncident.driver == occupant ? TC_DRIVER : TC_PASSENGER
  }

  property get DriverIcon() : String {
    return "driver"
  }

  property get DriverIconTooltip() : String {
    return DisplayKey.get("Web.NewLossDetailsScreen.VehicleIncidentIterator.Driver.IconLabel")
  }

  property get PassengerIcon() : String {
    return "passenger"
  }

  property get PassengerIconTooltip() : String {
    return DisplayKey.get("Web.NewLossDetailsScreen.VehicleIncidentIterator.Passenger.IconLabel")
  }

}