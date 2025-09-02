package gw.api.exposure.claimant

uses gw.cc.exposure.entity.ClaimantSupplier

/**
 * Implementation of ClaimantSupplier for InjuryIncidents.
 * The default claimant for exposures for InjuryIncidents is the injured party.
 */
@Export
class InjuryIncidentClaimantSupplier implements ClaimantSupplier {
  private final var _incident : InjuryIncident

  construct(incident : InjuryIncident) {
    _incident = incident
  }

  override property get ClaimantForExposure() : Contact {
    return _incident.injured
  }

  override property get ClaimantTypeForExposure() : ClaimantType {
    return ClaimantForExposure == _incident.Claim.Insured ? ClaimantType.TC_INSURED : ClaimantType.TC_OTHER
  }
}