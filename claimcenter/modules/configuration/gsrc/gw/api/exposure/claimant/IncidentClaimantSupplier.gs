package gw.api.exposure.claimant

uses gw.cc.exposure.entity.ClaimantSupplier

/**
 * Default implementation of ClaimantSupplier that returns null for both claimant and claimant type.
 */
@Export
public class IncidentClaimantSupplier implements ClaimantSupplier {

  construct(incident: Incident) {}

  override property get ClaimantForExposure() : Contact {
    return null
  }

  override property get ClaimantTypeForExposure() : ClaimantType {
    return null
  }
}