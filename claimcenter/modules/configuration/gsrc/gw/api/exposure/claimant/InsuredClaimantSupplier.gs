package gw.api.exposure.claimant

uses gw.cc.exposure.entity.ClaimantSupplier

/**
 * Implementation of ClaimantSupplier that uses the insured as the default claimant.
 */
@Export
class InsuredClaimantSupplier implements ClaimantSupplier {
  private final var _incident : Incident

  construct(incident : Incident) {
    _incident = incident
  }

  override property get ClaimantForExposure(): Contact {
    return _incident.Claim.Insured
  }

  override property get ClaimantTypeForExposure(): ClaimantType {
    return ClaimantType.TC_INSURED
  }
}