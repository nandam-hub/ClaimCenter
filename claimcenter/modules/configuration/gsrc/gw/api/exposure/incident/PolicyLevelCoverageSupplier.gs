package gw.api.exposure.incident

uses entity.RiskUnit

@Export
public class PolicyLevelCoverageSupplier extends IncidentCoverageSupplier {
  construct(incident : Incident) {
    super(incident)
  }

  override function match(riskUnit: RiskUnit): boolean {
    return false
  }
}