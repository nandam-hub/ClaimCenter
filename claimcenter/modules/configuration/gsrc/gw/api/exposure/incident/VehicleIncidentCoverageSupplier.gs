package gw.api.exposure.incident

@Export
public class VehicleIncidentCoverageSupplier extends IncidentCoverageSupplier {
  private final var _incident: VehicleIncident

  construct(incident : VehicleIncident) {
    super(incident)
    _incident = incident
  }

  override function match(riskUnit: RiskUnit): boolean {
    return riskUnit typeis VehicleRU and riskUnit.Vehicle == _incident.Vehicle
  }
}