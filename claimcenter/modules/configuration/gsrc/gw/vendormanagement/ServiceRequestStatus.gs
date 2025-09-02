package gw.vendormanagement

uses gw.api.locale.DisplayKey
uses gw.api.web.color.GWColor

@Export
enum ServiceRequestStatus {

  NONE("", \ -> "", null),
  INACTIVE("circle", \ -> DisplayKey.get("Web.ServiceRequest.Status.Inactive"), GWColor.THEME_ALERT_NEUTRAL),
  ATTENTION("alert", \ -> DisplayKey.get("Web.ServiceRequest.Status.Attention"), GWColor.THEME_ALERT_ERROR),
  COMPLETE("completed", \ -> DisplayKey.get("Web.ServiceRequest.Status.Complete"), null),
  GREEN("circle_checkmark", \ -> DisplayKey.get("Web.ServiceRequest.Status.Green"), GWColor.THEME_ALERT_SUCCESS),
  YELLOW("circle_exclamation_point", \ -> DisplayKey.get("Web.ServiceRequest.Status.Yellow"), GWColor.THEME_ALERT_WARNING),
  RED("circle_x", \ -> DisplayKey.get("Web.ServiceRequest.Status.Red"), GWColor.THEME_ALERT_ERROR)

  var _icon : String as readonly Icon
  var _iconColor : GWColor
  var _labelBlock : block() : String

  private construct(iconImg: String, iconLabel: block() : String, iconColor: GWColor) {
    _icon = iconImg
    _iconColor = iconColor
    _labelBlock = iconLabel
  }

  property get Label() : String {
    return _labelBlock()
  }

  property get IconColor() : GWColor {
    return _iconColor
  }
}
