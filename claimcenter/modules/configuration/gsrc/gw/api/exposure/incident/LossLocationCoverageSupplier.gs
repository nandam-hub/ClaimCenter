package gw.api.exposure.incident

uses entity.RiskUnit

@Export
public class LossLocationCoverageSupplier extends IncidentCoverageSupplier {
  private final var _incident: Incident

  construct(incident : Incident) {
    super(incident)
    _incident = incident
  }

  override function match(riskUnit: RiskUnit): boolean {
    return riskUnit typeis LocationBasedRU and riskUnit.Property.Address == _incident.Claim.LossLocation
  }
}