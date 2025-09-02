package edge.capabilities.claim.lob.impl.commonauto.dto

uses edge.jsonmapper.JsonProperty
uses edge.capabilities.claim.contact.dto.ContactDTO
uses edge.aspects.validation.annotations.Required
uses edge.aspects.validation.annotations.Size
uses edge.el.Expr
uses edge.aspects.validation.Validation

class VehicleIncidentDTO {
  @JsonProperty
  var _publicId : String as PublicID

  @JsonProperty
  var _tempId : String as TempID

  @Required(Expr.eq(Expr.getProperty("Collision", Validation.PARENT), true))
  @JsonProperty
  var _driver: ContactDTO as Driver

  @JsonProperty
  var _passengers : ContactDTO[] as Passengers

  @JsonProperty @Required
  var _vehicle : VehicleDTO as Vehicle

  @JsonProperty @Size(0, 1333)
  var _damageDescription : String as DamageDescription

   @JsonProperty @Size(0, 1333)
  var _propertyDamageDescription : String as PropertyDamageDescription

  @JsonProperty
  var _safeToDrive : Boolean as SafeToDrive // Operable field

  @JsonProperty
  var _airbagsDeployed : Boolean as AirbagsDeployed

  @JsonProperty
  var _equipmentFailure : Boolean as EquipmentFailure

  @JsonProperty
  var _vehicleTowed : Boolean as VehicleTowed // VehTowedInd field

  @JsonProperty
  var _rentalRequired : Boolean as RentalRequired

  @JsonProperty
  var _collision : Boolean as Collision

  @JsonProperty
  var _collisionPoint : typekey.CollisionPoint as CollisionPoint

  @JsonProperty
  var _theft : Boolean as Theft

  @JsonProperty
  var _severity : typekey.SeverityType as Severity
}
