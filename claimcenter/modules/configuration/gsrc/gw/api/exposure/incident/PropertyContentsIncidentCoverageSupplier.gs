package gw.api.exposure.incident

uses entity.RiskUnit
uses entity.Incident

@Export
public class PropertyContentsIncidentCoverageSupplier extends IncidentCoverageSupplier {
  private final var _incident: PropertyContentsIncident

  construct(incident : PropertyContentsIncident) {
    super(incident)
    _incident = incident
  }

  override function match(riskUnit: RiskUnit): boolean {
    return riskUnit typeis LocationBasedRU and riskUnit.Property == _incident.PropertyLocation
  }
}