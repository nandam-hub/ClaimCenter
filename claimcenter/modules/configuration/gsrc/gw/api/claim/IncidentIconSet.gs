package gw.api.claim

uses java.util.HashMap
uses java.lang.IllegalArgumentException
uses com.google.common.base.Preconditions
uses java.lang.IllegalStateException

/**
 * An icon set stores the icons used to represent incidents in the UI. Also
 * provides a simple registry of icon sets by incident type which can be used
 * to look up the usual icon set for a particular incident type.
 */
@Export
class IncidentIconSet {

  static var _iconSetsByType = new HashMap<Type,IncidentIconSet>()
  
  /** The incident type for this icon set */
  var _incidentType : Type as readonly IncidentType
  
  /** The default icon used in incident panels found on Loss Details screens */
  var _panelIcon : String as readonly DefaultPanelIcon

  /** The default icon used in title bar on New and Edit incident popup dialogs */
  var _headerIcon : String as readonly DefaultHeaderIcon
  
  /** The icon used in buttons related to the incident */
  var _buttonIcon : String
  
  /** Create a new icon set */
  construct(type : Type, panel : String, header : String, button : String) {
    _incidentType = type
    _panelIcon = Preconditions.checkNotNull(panel, "Panel icon must not be null")
    _headerIcon = Preconditions.checkNotNull(header, "Header icon must not be null")
    _buttonIcon = button
  }

  /**
   * Get the panel icon for the incident, which must be of the appropriate type.
   * The usual implementation returns the default panel icon, but some icon
   * sets (e.g. for VehicleIncident) have alternative icons depending on the
   * state of the incident.
   */
  function getPanelIcon(incident : Incident) : String {
    return DefaultPanelIcon
  }

  /**
   * Get the header icon for the incident, which must be of the appropriate type.
   * The usual implementation returns the default header icon, but some icon
   * sets (e.g. for VehicleIncident) have alternative icons depending on the
   * state of the incident.
   */
  function getHeaderIcon(incident : Incident) : String {
    return DefaultHeaderIcon
  }

  /**
   * The small icon used on buttons to create/view the incident. Not all incident
   * types have such an icon; this property will throw IllegalStateException if
   * called on an icon set with no button icon.
   */
  property get ButtonIcon() : String {
    if (_buttonIcon == null) {
      throw new IllegalStateException("Icon set for type " + IncidentType + " does not have a button icon")
    }
    return _buttonIcon
  }

  /**
   * Create a new icon set and register it as the usual icon set for the given
   * type. It is an error to call this method twice with the same type - the
   * second attempt will fail with an IllegalArgumentException
   */
  static function register(type : Type, panel : String, header : String, button : String) : IncidentIconSet {
    return register(new IncidentIconSet(type, panel, header, button))
  }

  /**
   * Register and then return an icon set as the usual icon set for its incident
   * type. It is an error to call this method twice with icon sets that have the
   * same incident type - the second attempt will fail with an IllegalArgumentException
   */
  static function register(iconSet : IncidentIconSet) : IncidentIconSet {
    if (_iconSetsByType.containsKey(iconSet.IncidentType)) {
      throw new IllegalArgumentException("Cannot register two IncidentIconSets for the same type: " + iconSet.IncidentType)
    }
    _iconSetsByType[iconSet.IncidentType] = iconSet
    return iconSet
  }
  
  /**
   * Get the usual icon set for the given incident type
   */
  static function getIconSetForType(incidentType : Type) : IncidentIconSet {
    return _iconSetsByType[incidentType]
  }
  
  /** Icons for baggage incident */
  final public static var BAGGAGE : IncidentIconSet
          = register(BaggageIncident, "baggage", "baggage", "baggage")

  /** Icons for dwelling incident */
  final public static var DWELLING : IncidentIconSet
          = register(DwellingIncident, "dwelling", "dwelling", null)

  /** Icons for injury incident */
  final public static var INJURY : IncidentIconSet
          = register(InjuryIncident, "injury", "injury", "injury")

  /** Icons for living expenses (aka loss of use) incident */
  final public static var LIVING_EXPENSES : IncidentIconSet
          = register(LivingExpensesIncident, "loss_of_use", "loss_of_use", null)
  
  /** Icons for other structure incident */
  final public static var OTHER_STRUCTURE : IncidentIconSet
          = register(OtherStructureIncident, "other_structures", "other_structures", null)
  
  /** Icons for property contents incident */
  final public static var PROPERTY_CONTENTS : IncidentIconSet
          = register(PropertyContentsIncident, "contents", "contents", null)

  /** Icons for property liability/fixed property incident */
  final public static var PROPERTY_LIABILITY : IncidentIconSet
          = register(FixedPropertyIncident, "property_incident", "property_incident", "property_incident")

  /** Icons for trip incident */
  final public static var TRIP : IncidentIconSet
          = register(TripIncident, "travel", "travel", "travel")

  /**
   * Icons for vehicle incident; vehicle incidents use different panel/header icons for first
   * and third party incidents
   */
  final public static var VEHICLE : IncidentIconSet = register(new IncidentIconSet(VehicleIncident, "personal_auto", "personal_auto", "personal_auto") {
    override function getPanelIcon(incident : Incident) : String {
      return incident typeis VehicleIncident and incident.LossParty == LossPartyType.TC_INSURED
              ? DefaultPanelIcon : "personal_auto"
    }
    override function getHeaderIcon(incident : Incident) : String {
      return incident typeis VehicleIncident and incident.LossParty == LossPartyType.TC_INSURED
              ? DefaultHeaderIcon : "personal_auto"
    }
  })

  /** Special case: panel icon used for injury incidents to pedestrians, for auto claims */
  final public static var PANEL_PEDESTRIAN_ICON : String = "pedestrian"
}
