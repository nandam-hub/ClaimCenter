package edge.capabilities.claim.lob.impl.commonauto.util

uses java.lang.UnsupportedOperationException
uses edge.capabilities.claim.lob.impl.commonauto.dto.VehicleDTO

/**
 * Vehicle utilities.
 */
class VehicleUtil {

  private construct() {
    throw new UnsupportedOperationException()
  }


  /**
   * Fills base properties on the vehicle.
   */
  public static function fillBaseProperties(dto : VehicleDTO, vehicle : Vehicle) {
    dto.PolicySystemId = vehicle.PolicySystemId
    dto.PublicID = vehicle.PublicID
    dto.Color = vehicle.Color
    dto.LicensePlate = vehicle.LicensePlate
    dto.Make = vehicle.Make
    dto.Manufacturer = vehicle.Manufacturer
    dto.Model = vehicle.Model
    dto.State = vehicle.State
    dto.VIN = vehicle.Vin
    dto.Year = vehicle.Year
    if(dto.State == null){
      dto.Country = typekey.Country.TC_US
    }else{
      dto.Country = dto.State.Categories.firstWhere(\ t -> t typeis Country) as Country
    }
  }

  /**
   * Fills base properties on the vehicle summary.
   */
  public static function fillPolicySummaryBaseProperties(dto : VehicleDTO, vehicle : PolicySummaryVehicle) {
    dto.PolicySystemId = vehicle.PolicySystemId
    dto.PublicID = vehicle.PublicID
    dto.Color = vehicle.Color
    dto.LicensePlate = vehicle.LicensePlate
    dto.Make = vehicle.Make
    dto.Model = vehicle.Model
    dto.State = vehicle.State
    dto.VIN = vehicle.Vin
    dto.Year = vehicle.Year;
    if(dto.State == null){
      dto.Country = Country.TC_US
    }else{
      dto.Country = dto.State.Categories.firstWhere(\ t -> t typeis Country) as Country
    }
  }
  
  
  public static function toDTO(c : Claim, vehicle : Vehicle) : VehicleDTO {
    final var res = new VehicleDTO()
    fillBaseProperties(res, vehicle)
    res.PolicyVehicle = isPolicyVehicle(c, vehicle)
    return res
  }
  
  
  public static function isPolicyVehicle(claim : Claim, vehicle : Vehicle) : boolean {
    return claim.Policy.Vehicles*.Vehicle.contains(vehicle)
  }
}
