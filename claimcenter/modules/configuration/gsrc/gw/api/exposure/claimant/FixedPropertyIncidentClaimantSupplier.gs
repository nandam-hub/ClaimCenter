package gw.api.exposure.claimant

uses gw.cc.exposure.entity.ClaimantSupplier

/**
 * Implementation of ClaimantSupplier for FixedPropertyIncidents.
 * The default claimant for exposures for FixedPropertyIncidents is the property owner.
 */
@Export
class FixedPropertyIncidentClaimantSupplier implements ClaimantSupplier {
  private final var _incident : FixedPropertyIncident

  construct(incident : FixedPropertyIncident) {
    _incident = incident
  }

  override property get ClaimantForExposure() : Contact {
    return _incident.incidentowner
  }

  override property get ClaimantTypeForExposure() : ClaimantType {
    return ClaimantType.TC_PROPERTYOWNER
  }
}