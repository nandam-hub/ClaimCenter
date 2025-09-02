package gw.api.alerts

uses gw.api.locale.DisplayKey
uses gw.api.nonproductionpluginimplementation.NonProductionPluginImplementationModeSystemAlert
uses gw.api.tools.ClusterMembersData
uses gw.api.system.server.ServerUtil

/**
 * The following determines what, if any, alerts will be displayed on the system alert bar.
 * See {@link pcf.SystemAlertBar} for usage.
 *
 * The enumerated type SystemAlertType is used primarily to give message details, and to determine if a message should be shown at all.
 * The order of these types is important, where the earlier types take precedence over the later ones. If two alerts can be shown,
 * only the higher priority alert is displayed.
 */
@Export
class SystemAlertInfo {
  enum SystemAlertType {
    NONPRODUCTION_PLUGIN_IMPLEMENTATION_MODE(
        \-> NonProductionPluginImplementationModeSystemAlert.get().Title,
        \-> NonProductionPluginImplementationModeSystemAlert.get().Message,
        \-> NonProductionPluginImplementationModeSystemAlert.get() != null,
        false
    ),
    READONLY(
        \-> DisplayKey.get("Web.TabBar.SystemAlertBar.ReadOnlyMode.Title"),
        \-> DisplayKey.get("Web.TabBar.SystemAlertBar.ReadOnlyMode.Message"),
        \-> ServerUtil.ReadOnly,
        false
    ),
    SHUTDOWN(
        \-> new ClusterMembersData().PlannedShutdownTitleForCurrentServer,
        \-> new ClusterMembersData().PlannedShutdownMessageForCurrentServer,
        \-> new ClusterMembersData().PlannedShutdownScheduled,
        true
    ),
    NONE(
        \-> null,
        \-> null,
        \-> false, // this is the critical bit, ensuring the SystemAlertBar does not render usually
        false
    )

    private var _title() : String
    private var _message() : String
    private var _displayAlert() : boolean
    private var _displayLogoutButton : boolean

    private construct(title() : String, message() : String, displayAlert() : boolean, displayLogoutButton : boolean) {
      _title = title
      _message = message
      _displayAlert = displayAlert
      _displayLogoutButton = displayLogoutButton
    }

    public property get Title() : String {
      return _title()
    }

    public property get Message() : String {
      return _message()
    }

    public property get DisplayAlert() : boolean {
      return _displayAlert()
    }

    public property get DisplayLogoutButton() : boolean {
      return _displayLogoutButton
    }
  }

  public static property get AlertType() : SystemAlertType {
    for (type in SystemAlertType.AllValues) { // technically loops through "NONE" type also, but never passes the check
      if (type.DisplayAlert) {
        return type
      }
    }
    return NONE
  }
}