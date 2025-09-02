package gw.vendormanagement

@Export
enhancement GWServiceRequestKindEnhancement : typekey.ServiceRequestKind {

  property get Label() : String {
    //noinspection DisplayKeyNotLiteral
    return gw.api.locale.DisplayKey.get("Web.ServiceRequest.Kind." + this.Code)
  }

  property get Icon() : String {

    switch (this) {
      case TC_QUOTEONLY:       return "service_request_quote"
      case TC_QUOTEANDSERVICE: return "service_request_quoteandservice"
      case TC_SERVICEONLY:     return "service_request"
      case TC_UNMANAGED:       return "service_request"
      default:                 return ""
    }

  }
}
