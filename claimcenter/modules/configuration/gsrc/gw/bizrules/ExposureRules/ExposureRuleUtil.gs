package gw.bizrules.ExposureRules

uses gw.api.exposure.incident.IncidentCoverageSupplier
uses gw.api.util.LOBUtil
uses gw.cc.bizrules.CCRulesUtil
uses gw.cc.exposure.entity.CoverageSupplier
uses gw.config.LOBAbstraction
uses typekey.PolicyType
uses typekey.Incident

@Export
class ExposureRuleUtil {
  private var _applicableIncidents: Set<Incident>
  private var _applicablePolicyTypes: Set<PolicyType>
  private var _policyToIncidentTypes: Map<PolicyType, Set<Incident>>
  private var _emptyIncidentTypeSet: Set<Incident>

  public construct() {
    _applicableIncidents = findApplicableIncidents()
    _applicablePolicyTypes = findApplicablePolicyTypes()
    _policyToIncidentTypes = mapPolicyTypeToIncidentTypes(_applicablePolicyTypes, _applicableIncidents)
    _emptyIncidentTypeSet = Collections.unmodifiableSet(new HashSet<Incident>())
  }

  /**
   * Returns set of Incident Types which are applicable for both the given policy type and exposure creation
   */
  public function getApplicableIncidentsForPolicy(policyType: PolicyType): Set<Incident> {
    if (policyType == null) {
      return _applicableIncidents
    }
    return _policyToIncidentTypes.getOrDefault(policyType, _emptyIncidentTypeSet)
  }

  /**
   * Returns set of Policy Types which are applicable for exposure creation
   */
  public property get ApplicablePolicyTypes(): Set<PolicyType> {
    return _applicablePolicyTypes
  }

  private function mapPolicyTypeToIncidentTypes(
      applicablePolicyTypes: Set<PolicyType>, applicableIncidentTypes: Set<Incident>): Map<PolicyType, Set<Incident>> {
    var map = new HashMap<PolicyType, Set<Incident>>()
    for(var policyType in applicablePolicyTypes) {
      var incidentTypes = applicableIncidentTypes
          .where(\incidentType -> not LOBUtil.getCoverageTypes({policyType}, {incidentType}).Empty)
          .toSet()

      map.put(policyType, Collections.unmodifiableSet(incidentTypes))
    }

    return Collections.unmodifiableMap(map)
  }

  private function findApplicableIncidents(): Set<Incident> {
    var types = new HashSet<Incident>()
    for (incident in Incident.getTypeKeys(false)) {
      var coverageSupplierImpls = CCRulesUtil.getImplementsInterfacesImpls(incident.EntityType, CoverageSupplier.Name)
      if (!coverageSupplierImpls.Empty and !coverageSupplierImpls.contains(IncidentCoverageSupplier.Name)) {
        types.add(incident)
      }
    }
    return Collections.unmodifiableSet(types)
  }

  private function findApplicablePolicyTypes(): Set<PolicyType> {
    var types = PolicyType.getTypeKeys(false)
        .subtract({LOBAbstraction.ForPolicy.WorkCompPolicyType, LOBAbstraction.ForPolicy.InlandMarinePolicyType})
    return Collections.unmodifiableSet(types)
  }
}