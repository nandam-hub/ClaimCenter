package gw.surepath.cc.configuration.timeline.creation.ui

uses gw.surepath.cc.configuration.timeline.creation.TimelineUtil
uses gw.entity.IEntityType
uses gw.surepath.suite.configuration.annotation.IncludeInDocumentation

/**
 * This is the Claim Timeline helper which takes care of the claim related service requests for
 * the Quote or the Invoice forwards. When a Quote or an Invoice is selected from the Claim Timeline
 * it takes directly to the desired Quote or Invoice.
 */
@IncludeInDocumentation
class TimelineForwardHelper {
  public static function doServiceRequestInvoiceForward(publicID: String, type: String, claim: Claim) {
    var invoice = TimelineUtil.findByPublicId(
        gw.lang.reflect.TypeSystem.getByFullNameIfValid(type) as IEntityType, publicID)
        as ServiceRequestInvoice
    pcf.ClaimServiceRequestForward.go(claim, invoice.ServiceRequest, invoice)

  }

  public static function doServiceRequestQuoteForward(publicID: String, type: String, claim: Claim) {
    var quote = TimelineUtil.findByPublicId(gw.lang.reflect.TypeSystem.getByFullNameIfValid(type) as gw.entity.IEntityType, publicID) as ServiceRequestQuote
    pcf.ClaimServiceRequests.go(claim, quote.ServiceRequest);
    pcf.QuoteDetailsPopup.push(quote)

  }
}
