package gw.bizrules

uses com.google.common.collect.ImmutableList
uses gw.api.database.ISelectQueryBuilder
uses gw.api.database.InOperation
uses gw.api.database.Queries
uses gw.api.database.Relop
uses gw.api.locale.DisplayKey
uses gw.bizrules.ExposureRules.ExposureRuleUtil
uses gw.bizrules.ReserveRules.ReserveRuleUtil
uses gw.bizrules.management.RuleQueryFactory
uses gw.entity.IEntityType
uses gw.lang.reflect.features.PropertyReference

/**
 * Class to manage the Rules Search Panel Filter Criteria - This stores all the criteria
 * used to create a filter
 */
@Export
abstract class CCRuleFilterCriteriaBase<T extends CCRule> implements CCRuleFilterCriteria<T> {

  static final var AVAILABLE   = DisplayKey.get("Web.BizRules.Rule.RuleDetails.Availability.Available")
  static final var UNAVAILABLE = DisplayKey.get("Web.BizRules.Rule.RuleDetails.Availability.Unavailable")

  static final var _availabilityVals: List<String> as readonly AvailabilityVals = ImmutableList.copyOf({
      AVAILABLE,
      UNAVAILABLE
  })

  private final static var _exposureRuleUtil = new ExposureRuleUtil()
  private final static var _reserveRuleUtil = new ReserveRuleUtil()

  /**
   * Filter Fields
   */
  var _availability: String as Availability
  var _availableStatuses: RuleQueryFactory<T>[]as AvailableStatuses
  var _jurisdiction: Jurisdiction as Jurisdiction
  var _lossType: LossType
  var _lossPartyType: LossPartyType as LossPartyType
  var _incidentType: typekey.Incident as IncidentType
  var _exposureType: ExposureType as ExposureType
  var _claimSegment: ClaimSegment as ClaimSegment
  var _nameOrDescription: String as NameOrDescription
  var _policyType: PolicyType
  var _ruleActionKey: typekey.RuleActionKey as RuleActionKey


  // Default status is the only filter which is not set to null by default.
  // Store a copy of it for later (to see if filters have been modified)
  var _defaultStatus: RuleQueryFactory<T>
  var _status: RuleQueryFactory<T>
  var _ruleSubtype: typekey.Rule as readonly RuleSubtype

  /**
   * Default Constructor
   */
  protected construct(ruleSubtype: typekey.Rule) {
    _ruleSubtype = ruleSubtype

    var queryFactories = PageHelper.RuleQueryFactories
    var statusAll = DisplayKey.get("BizRules.RulesPage.Query.All")
    _defaultStatus = queryFactories.singleWhere(\status -> status.DisplayName == statusAll)
    _status = _defaultStatus
    _availableStatuses = queryFactories.toTypedArray()
  }

  override property get Status(): RuleQueryFactory<T> {
    return _status
  }

  override property set Status(status: RuleQueryFactory<T>) {
    _status = status
  }

  public property get PolicyType(): PolicyType {
    return _policyType
  }

  public property set PolicyType(value: PolicyType) {
    _policyType = value
    var policyIncidents = _exposureRuleUtil.getApplicableIncidentsForPolicy(_policyType)
    if (not policyIncidents.contains(_incidentType)) {
      _incidentType = null
    }
    var applicableExposureTypesForLossTypeAndPolicyType = _reserveRuleUtil.findApplicableExposureTypesForLossTypeAndPolicyType(_lossType, _policyType)
    if (not applicableExposureTypesForLossTypeAndPolicyType.contains(_exposureType)) {
      _exposureType = null
    }
  }

  public property get LossType(): LossType {
    return _lossType
  }

  public property set LossType(value: LossType) {
    _lossType = value
    var applicablePolicyTypesForLossType = _reserveRuleUtil.findApplicablePolicyTypesForLossType(_lossType)
    if (not applicablePolicyTypesForLossType.contains(_policyType)) {
      _policyType = null
    }
    var applicableExposureTypesForLossTypeAndPolicyType = _reserveRuleUtil.findApplicableExposureTypesForLossTypeAndPolicyType(_lossType, _policyType)
    if (not applicableExposureTypesForLossTypeAndPolicyType.contains(_exposureType)) {
      _exposureType = null
    }

    var applicableClaimSegmentsForLossType = _reserveRuleUtil.findApplicableClaimSegmentsForLossType(_lossType)
    if (not applicableClaimSegmentsForLossType.contains(_claimSegment)) {
      _claimSegment = null
    }
  }

  override function relevantActionsIn(keys: RuleActionKey[]): List<RuleActionKey> {
    return Arrays.asList(keys).where(\key -> key.hasCategory(RuleSubtype))
  }

  override property set NameOrDescription(str: String) {
    _nameOrDescription = str?.trim()
  }

  /**
   * Checks to see if a filter is present on the page
   * currently
   *
   * @return true/false depending on if the filter is present
   */
  override property get Specified(): boolean {
    return _availability != null
        || _jurisdiction != null
        || _lossType != null
        || _nameOrDescription != null
        || _policyType != null
        || _status != _defaultStatus
        || _lossPartyType != null
        || _incidentType != null
        || _exposureType != null
        || _claimSegment != null
  }

  /**
   * Clears out all the filter variables
   */
  override function clear() {
    _availability = null
    _jurisdiction = null
    _lossType = null
    _nameOrDescription = null
    _policyType = null
    _ruleActionKey = null
    _status = _defaultStatus
    _lossPartyType = null
    _incidentType = null
    _exposureType = null
    _claimSegment = null
  }

  /**
   * Main method to create the rule query using the filters
   *
   * @param query
   */
  override function apply(query: ISelectQueryBuilder<T>) {
    if (!Specified) {
      return
    }
    if (_nameOrDescription.HasContent) {
      query.or(\r -> {
        r.contains(Rule#Name, _nameOrDescription, true)
        r.contains(Rule#Description, _nameOrDescription, true)
      })
    }

    if (_availability == AVAILABLE) {
      query.compare(Rule#AvailableToRun, Relop.Equals, true)
    } else if (_availability == UNAVAILABLE) {
      query.compare(Rule#AvailableToRun, Relop.Equals, false)
    }
    // else it is unspecified

    if (_lossType != null) {
      filter<AppCritLossType, LossType>(query, AppCritLossType#LossType, _lossType, AppCritLossType#Rule)
    }

    if (_policyType != null) {
      filter<AppCritPolicyType, PolicyType>(query, AppCritPolicyType#PolicyType, _policyType, AppCritPolicyType#Rule)
    }

    if (_jurisdiction != null) {
      filter<AppCritJurisdiction, Jurisdiction>(query, AppCritJurisdiction#Jurisdiction, _jurisdiction, AppCritJurisdiction#Rule)
    }

    if (_lossPartyType != null) {
      filter<AppCritLossPartyType, LossPartyType>(query, AppCritLossPartyType#LossPartyType, _lossPartyType, AppCritLossPartyType#Rule)
    }

    if (_incidentType != null) {
      filter<AppCritIncidentType, typekey.Incident>(query, AppCritIncidentType#IncidentType, _incidentType, AppCritIncidentType#Rule)
    }

    if (_exposureType != null) {
      filter<AppCritExposureType, ExposureType>(query, AppCritExposureType#ExposureType, _exposureType, AppCritExposureType#Rule)
    }

    if (_claimSegment != null) {
      filter<AppCritClaimSegment, ClaimSegment>(query, AppCritClaimSegment#ClaimSegment, _claimSegment, AppCritClaimSegment#Rule)
    }
  }

  private reified function filter<E extends gw.pl.persistence.core.Bean, V>(query: ISelectQueryBuilder<T>, filterProp: PropertyReference<E, V>, filterValue: V,
                                                                    ruleProperty: PropertyReference<E, CCRule>) {
    var tableQuery = Queries.createQuery<E>(E as IEntityType)
    var filterQuery = Queries.createQuery<E>(E as IEntityType).compare(filterProp, Relop.Equals, filterValue)
    query.or(\orRestriction -> {
      orRestriction.subselect(ActivityRule#ID, InOperation.CompareIn, filterQuery, ruleProperty)
      orRestriction.subselect(ActivityRule#ID, InOperation.CompareNotIn, tableQuery, ruleProperty)
    })
  }

}
