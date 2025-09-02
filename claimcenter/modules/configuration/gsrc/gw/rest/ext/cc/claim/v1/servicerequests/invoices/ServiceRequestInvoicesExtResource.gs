package gw.rest.ext.cc.claim.v1.servicerequests.invoices

uses gw.api.modules.rest.framework.v1.resources.CollectionBacking
uses gw.rest.core.cc.claim.v1.servicerequests.invoices.ServiceRequestInvoicesCoreResource

@Export
class ServiceRequestInvoicesExtResource extends ServiceRequestInvoicesCoreResource {
  protected override property get CollectionBacking() : CollectionBacking {
    return this.Parent.Claim.Policy.PolicyType == PolicyType.TC_WORKERSCOMP ? gw.api.modules.rest.framework.v1.resources.CollectionBacking.Query : super.CollectionBacking
  }
}