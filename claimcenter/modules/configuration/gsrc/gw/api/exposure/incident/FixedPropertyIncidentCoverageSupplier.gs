package gw.api.exposure.incident

uses entity.RiskUnit
uses entity.Incident

@Export
public class FixedPropertyIncidentCoverageSupplier extends IncidentCoverageSupplier {
  private final var _incident: FixedPropertyIncident

  construct(incident : FixedPropertyIncident) {
    super(incident)
    _incident = incident
  }

  override function match(riskUnit: RiskUnit): boolean {
    return riskUnit typeis LocationBasedRU and riskUnit.Property == _incident.Property
  }
}