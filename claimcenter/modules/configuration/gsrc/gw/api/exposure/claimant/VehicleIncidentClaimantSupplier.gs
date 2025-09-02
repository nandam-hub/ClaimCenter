package gw.api.exposure.claimant

uses gw.cc.exposure.entity.ClaimantSupplier

/**
 * Implementation of ClaimantSupplier for Vehicle Incidents.
 * When creating an exposure for a first party vehicle incident, the default claimant is the policy's insured.
 * When creating an exposure for a third party vehicle incident, the default claimant is the vehicle's owner.
 */
@Export
public class VehicleIncidentClaimantSupplier implements ClaimantSupplier {
  private final var _incident : VehicleIncident

  construct(incident : VehicleIncident) {
    _incident = incident
  }

  /**
   * @return the insured if first party, owner of vehicle otherwise
   */
  override property get ClaimantForExposure() : Contact {
    return _incident.LossParty == LossPartyType.TC_INSURED ?
        _incident.Claim.Insured :
        _incident.incidentowner
  }

  /**
   * @return Insured if first party, Owner of Other Vehicle otherwise
   */
  override property get ClaimantTypeForExposure() : ClaimantType {
    return _incident.LossParty == LossPartyType.TC_INSURED ?
        ClaimantType.TC_INSURED :
        ClaimantType.TC_VEH_OTHER_OWNER
  }
}
