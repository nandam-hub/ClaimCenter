package edge.capabilities.claim.lob.impl.generalliability.fnol

uses edge.capabilities.claim.lob.impl.general.fnol.dto.GeneralFnolExtensionDTO
uses edge.capabilities.claim.lob.shared.incidents.IInjuryIncidentPlugin
uses edge.capabilities.claim.lob.impl.general.fnol.GeneralFnolPlugin
uses edge.di.annotations.InjectableNode
uses edge.security.authorization.IAuthorizerProviderPlugin

/**
 * General liability extension for the fnol wizard.
 */
class GLFnolPlugin extends GeneralFnolPlugin {
  
  @InjectableNode
  construct(incidentPlugin : IInjuryIncidentPlugin, authzProvider:IAuthorizerProviderPlugin) {
    super(incidentPlugin, authzProvider);
  }

  override function isPolicyTypeSupprted(type: PolicyType): boolean {
    return type == PolicyType.TC_GENERALLIABILITY
  }

  override function submitClaim(claim: Claim, dto: GeneralFnolExtensionDTO) {

  }
}
