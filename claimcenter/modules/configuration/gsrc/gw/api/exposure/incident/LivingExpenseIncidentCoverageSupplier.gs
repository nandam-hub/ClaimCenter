package gw.api.exposure.incident

uses entity.RiskUnit

@Export
public class LivingExpenseIncidentCoverageSupplier extends IncidentCoverageSupplier {
  private final var _incident: LivingExpensesIncident

  construct(incident : LivingExpensesIncident) {
    super(incident)
    _incident = incident
  }

  override function match(riskUnit: RiskUnit): boolean {
    return riskUnit typeis PropertyRU and riskUnit.Property.Address == _incident.Claim.LossLocation
  }
}