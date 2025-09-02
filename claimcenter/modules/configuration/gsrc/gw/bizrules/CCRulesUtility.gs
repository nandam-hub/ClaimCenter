package gw.bizrules

uses gw.api.util.CurrencyUtil
uses gw.api.util.DateUtil
uses gw.plugin.bizrules.BizRulesUtility

uses java.util.Date

/**
 * Utility class which defines methods and properties available to use as parameters in Conditions and Actions sections
 */
@Export
class CCRulesUtility implements BizRulesUtility {

  public static var INSTANCE : CCRulesUtility = new CCRulesUtility()

  private construct() {}

  /**
   * Returns the threshold value for the creating activities
   */
  public function getSIActivityThreshold(): int {
    return ScriptParameters.SpecialInvestigation_CreateActivityForSupervisorThreshold
  }

  /**
   * Returns the current date
   */
  public function currentDate(): Date {
    return DateUtil.currentDate()
  }

  /**
   * Returns the reserve amount for a low segment vehicle damage exposure
   */
  public property get InitialReserveForAutoMinorVehicleDamageBody(): int {
    return ScriptParameters.InitialReserve_AutoMinorVehicleDamageBody
  }

  /**
   * Returns the reserve amount for a medium segment vehicle damage exposure
   */
  public property get InitialReserveForAutoMediumVehicleDamageBody(): int {
    return ScriptParameters.InitialReserve_AutoMediumVehicleDamageBody
  }

  /**
   * Returns the inspection reserve amount for a medium segment vehicle damage exposure
   */
  public property get InitialReserveForAutoMediumVehicleDamageInspection(): int {
    return ScriptParameters.InitialReserve_AutoMediumVehicleDamageInspection
  }

  /**
   * Returns the reserve amount for a medium segment vehicle damage exposure
   */
  public property get InitialReserveForAutoMajorVehicleDamageBody(): int {
    return ScriptParameters.InitialReserve_AutoMajorVehicleDamageBody
  }

  /**
   * Returns the inspection reserve amount for a high segment vehicle damage exposure
   */
  public property get InitialReserveForAutoMajorVehicleDamageInspection(): int {
    return ScriptParameters.InitialReserve_AutoMajorVehicleDamageInspection
  }

  /**
   * Returns the default currency specified in the DefaultApplicationCurrency config.xml parameter
   */
  public property get DefaultApplicationCurrency(): Currency {
    return CurrencyUtil.DefaultCurrency
  }
}