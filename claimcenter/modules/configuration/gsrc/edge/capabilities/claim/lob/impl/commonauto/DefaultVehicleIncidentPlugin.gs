package edge.capabilities.claim.lob.impl.commonauto

uses edge.capabilities.claim.contact.IClaimContactPlugin
uses edge.capabilities.claim.contact.dto.ContactDTO
uses edge.capabilities.claim.lob.impl.commonauto.dto.VehicleDTO
uses edge.capabilities.claim.lob.impl.commonauto.dto.VehicleIncidentDTO
uses edge.capabilities.claim.lob.impl.commonauto.util.VehicleUtil
uses edge.di.annotations.ForAllGwNodes
uses edge.security.authorization.IAuthorizerProviderPlugin
uses edge.util.mapping.ArrayUpdater
uses edge.util.mapping.Mapper
uses edge.util.mapping.RefUpdater

/**
 * Vehicle incident conversion plugin.
 */
class DefaultVehicleIncidentPlugin implements edge.capabilities.claim.lob.impl.commonauto.IVehicleIncidentPlugin {

  /**
   * Plugin used to access claim contacts.
   */
  private var _claimContactPlugin : IClaimContactPlugin

  private var _mapper : Mapper as Mapper
  private var _passengerUpdater : ArrayUpdater<VehicleIncident,ClaimContact,ContactDTO>
  private var _vehicleUpdater : RefUpdater<VehicleIncident,Vehicle,VehicleDTO>

  @ForAllGwNodes
  construct(claimContactPlugin : IClaimContactPlugin, authzProvider:IAuthorizerProviderPlugin) {
    this._claimContactPlugin = claimContactPlugin

    this._passengerUpdater = new ArrayUpdater<VehicleIncident,ClaimContact,ContactDTO>(authzProvider){
      : EntityKey = \ c -> c.Contact.PublicID,
      : ToCreateAndAdd = \ v, d -> v.addRole(ContactRole.TC_PASSENGER,new Person()).ClaimContact,
      : ToRemove = \ i,p -> i.removeRole(ContactRole.TC_PASSENGER,p.Contact),
      : ToAdd = \ i, p -> i.addRole(ContactRole.TC_PASSENGER,p.Contact),
      : AllowedValues =  \ i -> i.Claim.Contacts
    }

    this._vehicleUpdater = new RefUpdater<VehicleIncident,Vehicle,VehicleDTO>(authzProvider){
      : ToCreate = \ vi,d -> new Vehicle(),
      : AllowedValues = \ vi -> vi.Claim.Vehicles
    }

    this._mapper = new Mapper(authzProvider)
  }

  override function toDTO(incident : VehicleIncident) : VehicleIncidentDTO {
    return Mapper.mapRef(incident,\ i -> {
      final var res = new VehicleIncidentDTO()
      fillBaseProperties(res, incident)
      res.Driver = Mapper.mapRef(
          incident.getClaimContactByRole(ContactRole.TC_DRIVER),
          \ c -> _claimContactPlugin.toContactDTO(c)
      )
      res.Passengers = _claimContactPlugin.toContactDTO(incident.getClaimContactsByRole(ContactRole.TC_PASSENGER))
      res.Vehicle = _mapper.mapRef(incident.Vehicle, \ v -> vehicleToDTO(incident.Claim, v))

      return res
    })
  }

  override function updateIncident(incident : VehicleIncident, dto : VehicleIncidentDTO) {
    updateBaseProperties(incident, dto)
    final var claim = incident.Claim
    incident.driver = _claimContactPlugin.getUpdatedContact(claim, dto.Driver) as Person

    _passengerUpdater.updateArray(
        incident,
        incident.getClaimContactsByRole(ContactRole.TC_PASSENGER),
        dto.Passengers,
        \ vi, d -> _claimContactPlugin.getUpdatedContact(claim,d)
    )

    incident.Vehicle = _vehicleUpdater.updateRef(incident, dto.Vehicle,\ v, d -> {
      if ( incident.Claim.canEditVehicle(v) ) {
        updateVehicle(v,d)
      }
    })

  }

  /**
   * Updates vehicle data.
   */
  protected function updateVehicle(vehicle : Vehicle, dto : VehicleDTO) {
    vehicle.Color = dto.Color
    vehicle.LicensePlate = dto.LicensePlate
    vehicle.Make = dto.Make
    vehicle.Manufacturer = dto.Manufacturer
    vehicle.Model = dto.Model
    vehicle.State = dto.State
    vehicle.Vin = dto.VIN
    vehicle.Year = dto.Year
  }

  protected function vehicleToDTO(claim : Claim, v : Vehicle) : VehicleDTO {
    final var res = new VehicleDTO()
    VehicleUtil.fillBaseProperties(res, v)
    res.PolicyVehicle = VehicleUtil.isPolicyVehicle(claim, v)
    return res
  }

  public static function fillBaseProperties(dto : VehicleIncidentDTO, incident : VehicleIncident) {
    dto.PublicID = incident.PublicID
    dto.DamageDescription = incident.Description
    dto.PropertyDamageDescription = incident.PropertyDesc
    dto.SafeToDrive = incident.VehicleOperable
    dto.AirbagsDeployed = incident.AirbagsDeployed
    dto.EquipmentFailure = incident.EquipmentFailure
    dto.VehicleTowed = incident.VehTowedInd
    dto.RentalRequired = incident.RentalRequired
    dto.Collision = incident.Collision
    dto.CollisionPoint = incident.CollisionPoint
    dto.Theft = incident.VehStolenInd
    dto.Severity = incident.Severity
  }

  public static function updateBaseProperties(incident : VehicleIncident, dto : VehicleIncidentDTO) {
    incident.Description = dto.DamageDescription
    incident.PropertyDesc = dto.PropertyDamageDescription
    incident.VehicleOperable = dto.SafeToDrive
    incident.AirbagsDeployed = dto.AirbagsDeployed
    incident.EquipmentFailure = dto.EquipmentFailure
    incident.VehTowedInd = dto.VehicleTowed
    incident.RentalRequired = dto.RentalRequired
    incident.Collision = dto.Collision
    incident.CollisionPoint = dto.CollisionPoint
    incident.VehStolenInd = dto.Theft
    incident.Severity = dto.Severity
  }
}
