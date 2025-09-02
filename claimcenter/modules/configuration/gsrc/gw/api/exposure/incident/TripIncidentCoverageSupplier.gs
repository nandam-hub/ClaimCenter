package gw.api.exposure.incident

uses entity.RiskUnit

@Export
public class TripIncidentCoverageSupplier extends IncidentCoverageSupplier {
  private final var _incident: TripIncident

  construct(incident : TripIncident) {
    super(incident)
    _incident = incident
  }

  override function match(riskUnit: RiskUnit): boolean {
    return riskUnit typeis TripRU and riskUnit == _incident.TripRU
  }
}