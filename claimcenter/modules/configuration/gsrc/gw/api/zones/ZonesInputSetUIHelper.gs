package gw.api.zones

uses gw.api.util.ZoneInputSetConfigZoneType
uses gw.api.util.ZonesInputSetConfig

@Export
class ZonesInputSetUIHelper {

  private var _zoneContainer : ZoneContainer as ZoneContainer
  private var _country : Country as Country
  private var _zonesInputSetConfig : ZonesInputSetConfig as ZonesInputSetConfig
  private var _screenType : String as ScreenType

  construct(zoneContainer : ZoneContainer, screenType: String,country : Country) {
    _zoneContainer = zoneContainer
    _country = country
    _zonesInputSetConfig = ZonesInputSetConfig.getForCountry(country)
    _screenType = screenType
  }

  property get FilterByLabel() : String {
    if (ZonesInputSetConfig == null) {
      return ""
    }

    return FilterZoneTypeCode.DisplayName
  }

  property get ZoneTypes() : ZoneType[] {
    if (ZonesInputSetConfig == null) {
      return ZoneContainer.getDefaultZoneTypes(Country)
    }

    return ZonesInputSetConfig.getZoneSettings(ScreenType)
        .map(\entry -> entry.ZoneType)
        .toTypedArray()
  }

  property get FilterZoneTypeCode() : ZoneType {
    if (ZonesInputSetConfig == null) {
      return null
    }

    return ZonesInputSetConfig.getZoneSettings(ScreenType)
        .firstWhere(\entry -> entry.ZoneType == ZoneContainer.FilterCriteria.ZoneType and entry.FilterBy != null)
        .FilterBy
  }

  property get FilterVisible() : boolean {
    if (ZonesInputSetConfig == null) {
      return false
    }

    return ZonesInputSetConfig.getZoneSettings(ScreenType)
        .hasMatch(\entry ->
            entry.FilterBy != null
                and entry.ZoneType == ZoneContainer.FilterCriteria.ZoneType
        )
  }

  property get ListViewVisible() : boolean {
    if (ZonesInputSetConfig == null) {
      return true
    }

    return ZonesInputSetConfig.getZoneSettings(ScreenType)
        .hasMatch(\entry ->
            entry.SelectionType == ZoneInputSetConfigZoneType.SelectionType.LIST_VIEW
                and entry.ZoneType == ZoneContainer.FilterCriteria.ZoneType
        )
  }

  property get ZoneInputVisible() : boolean {
    if (ZonesInputSetConfig == null) {
      return false
    }

    return not(
        ZoneContainer.FilterCriteria.ZoneType == null or
            ListViewVisible or
            (
                FilterVisible and ZoneContainer.FilterCriteria.LinkedZone == null
            )
    )
  }

  property get PossibleCountries() : List<Country> {
    var org = User.util.CurrentUser.Organization
    if (org == null) {
      org = User.util.UnrestrictedUser.Organization
    }
    return org.Countries
  }

}
