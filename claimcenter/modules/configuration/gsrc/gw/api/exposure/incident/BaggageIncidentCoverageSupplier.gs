package gw.api.exposure.incident

uses entity.RiskUnit

@Export
public class BaggageIncidentCoverageSupplier extends IncidentCoverageSupplier {
  private final var _incident: BaggageIncident

  construct(incident : BaggageIncident) {
    super(incident)
    _incident = incident
  }

  override function match(riskUnit: RiskUnit): boolean {
    return riskUnit typeis TripRU and riskUnit == _incident.RelatedTripRU
  }
}