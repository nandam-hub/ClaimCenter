package gw.plugin.vendormanagement

uses gw.api.feature.AutomaticProcessingFeatureInfo

@Export
class InvoiceAutoHelperFilter {
  public static function shouldFilterOutInvoice(invoice: ServiceRequestInvoice): boolean {
    return AutomaticProcessingFeatureInfo.isEnabled() &&
        invoice.ServiceRequest.ExposureGw.AutopilotStatus == ExposureAutopilotStatus.TC_CURRENTLY_PROCESSING;
  }
} 