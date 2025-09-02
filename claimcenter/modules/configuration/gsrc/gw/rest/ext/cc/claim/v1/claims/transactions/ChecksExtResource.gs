package gw.rest.ext.cc.claim.v1.claims.transactions

uses gw.api.modules.rest.framework.v1.resources.CollectionBacking
uses gw.rest.core.cc.claim.v1.claims.transactions.ChecksCoreResource

@Export
class ChecksExtResource extends ChecksCoreResource {
  protected override property get CollectionBacking() : CollectionBacking {
    return this.Parent.Claim.Policy.PolicyType == PolicyType.TC_WORKERSCOMP ? gw.api.modules.rest.framework.v1.resources.CollectionBacking.Query : super.CollectionBacking
  }
}