package gw.rest.ext.cc.claim.v1.servicerequests

uses gw.api.modules.rest.framework.v1.resources.CollectionBacking
uses gw.rest.core.cc.claim.v1.servicerequests.ClaimServiceRequestsCoreResource

@Export
class ClaimServiceRequestsExtResource extends ClaimServiceRequestsCoreResource {
  protected override property get CollectionBacking() : CollectionBacking {
    return this.Parent.Claim.Policy.PolicyType == PolicyType.TC_WORKERSCOMP ? gw.api.modules.rest.framework.v1.resources.CollectionBacking.Query : super.CollectionBacking
  }
}