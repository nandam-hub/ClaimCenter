package gw.pcf

@Export
class LossPartyUtils {
  private construct() {
  }

  public static function getLossParty(incident: Dynamic): String {
    if (incident.hasProperty("LossParty")) {
      return incident.LossParty
    } else if (incident.hasProperty("VehicleLossParty")) {
      return incident.VehicleLossParty
    } else {
      return null
    }
  }

  public static function hasLossParty(incident: Dynamic): boolean {
    return getLossParty(incident) != null
  }
}