package edge.capabilities.claim.lob.impl.inlandmarine.claimdetail

uses edge.capabilities.claim.lob.shared.incidents.IInjuryIncidentPlugin
uses edge.capabilities.claim.lob.impl.general.claimdetail.GeneralClaimDetailPlugin
uses edge.di.annotations.InjectableNode

class IMClaimDetailPlugin extends GeneralClaimDetailPlugin {

  @InjectableNode
  @Param("injuryIncidentPlugin", "Plugin used for injury incidents")
  construct(injuryIncidentPlugin : IInjuryIncidentPlugin) {
    super(injuryIncidentPlugin)
  }

  override function isPolicyTypeSupprted(type: PolicyType): boolean {
    return type == PolicyType.TC_INLANDMARINE
  }
}
