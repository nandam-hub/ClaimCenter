package gw.plugin.vehiclevaluation

uses gw.api.financials.CurrencyAmount
uses gw.vendormanagement.SpecialistServiceCodeConstants

uses java.math.BigDecimal
uses java.time.Year

@Export
class VehicleValuationPluginDemo implements VehicleValuationPlugin {

  private static final var MIN_THRESHOLD_AMOUNT = new BigDecimal("100")
  private static final var MAX_THRESHOLD_AMOUNT = new BigDecimal("300000")

  override function isValuationRequired(incident : VehicleIncident, serviceRequest : ServiceRequest) : ValuationRequired {
    // Don't update ValuationRequired if analytics has already indicated it isn't required
    if (incident.ValuationRequired == ValuationRequired.TC_NO_ANALYTICS_INDICATE_REPAIR) {
      return incident.ValuationRequired
    }

    var hasAutoBodyRepairService = false
    var services = serviceRequest.Instruction.Services;
    for (service in services) {
      if (service.Service.Code == SpecialistServiceCodeConstants.AUTOBODYREPAIR) {
        hasAutoBodyRepairService = true
        break
      }
    }

    if (hasAutoBodyRepairService) {
      var quote = serviceRequest.LatestQuote
      var quoteAmount = quote.Amount
      var minThreshold = quoteAmount.Currency == Currency.TC_JPY ? MIN_THRESHOLD_AMOUNT * 100 : MIN_THRESHOLD_AMOUNT
      var maxThreshold = quoteAmount.Currency == Currency.TC_JPY ? MAX_THRESHOLD_AMOUNT * 100 : MAX_THRESHOLD_AMOUNT
      if (quoteAmount.Amount < minThreshold) {
        return ValuationRequired.TC_NO_QUOTE_INDICATES_REPAIR
      } else if (quoteAmount.Amount > maxThreshold) {
        return ValuationRequired.TC_NO_QUOTE_INDICATES_TOTAL_LOSS
      }
    }

    return ValuationRequired.TC_YES
  }

  override function shouldRequestValuation(incident : VehicleIncident) : boolean {
    // If property value is already set for the incident, do not request another valuation
    return (incident.PropertyValue == null && incident.ValuationRequired == ValuationRequired.TC_YES)
  }

  override function performValuation(incident : VehicleIncident) {
    incident.setValuationSource(TC_DEMO)

    var vehicleAge = Year.now().getValue() - incident.Vehicle.Year
    var vehicleValue = Math.max(30000 - 2000 * vehicleAge, 1500)
    incident.setPropertyValue(new CurrencyAmount(vehicleValue, incident.Claim.Currency))
  }
}