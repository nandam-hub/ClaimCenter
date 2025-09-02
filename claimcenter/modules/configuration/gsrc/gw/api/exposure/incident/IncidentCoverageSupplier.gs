package gw.api.exposure.incident

uses gw.cc.exposure.entity.CoverageSupplier

@Export
public class IncidentCoverageSupplier implements CoverageSupplier {
  private final var _incident: Incident

  construct(incident: Incident) {
    _incident = incident
  }

  /**
   * This method has the following logic:
   * 1. It tries to find any risk units under the policy by the protected method match supplied by each type of incidents.
   * 2. If there is only 1 coverage with the given coverageType in all matched RU then it is returned.
   * 3. If there is 0 matched coverages then:
   *    3.1. If there is only 1 policy level matched coverage then it is returned, otherwise null is returned.
   * 4. If there are more then 1 matched coverages then null is returned.
   * @param coverageType
   * @return matched to the given coverageType and incident parameters coverage.
   */
  @Override
  public function getCoverageByType(coverageType: CoverageType): Coverage {
      try {
        var matchedRUCoverages = findRULevelCoveragesByType(coverageType)

        if (matchedRUCoverages.length == 0) {
          var matchedPolicyCoverages = findPolicyLevelCoveragesByType(coverageType)
          return matchedPolicyCoverages.length == 1 ? matchedPolicyCoverages[0] : null
        } else if (matchedRUCoverages.length == 1) {
          return matchedRUCoverages[0];
        }
        return null;
      }
      catch (UnsupportedOperationException) {
        return null;
      }
  }

  /**
  * By default it throws <code>UnsupportedOperationException</code>.
  * @return true if the incident is related to the given RU, false otherwise.
  * */
  protected function match(riskUnit: RiskUnit): boolean {
    throw new UnsupportedOperationException()
  }

  private function findRULevelCoveragesByType(coverageType: CoverageType): Coverage[] {
    return _incident.Claim.Policy.RiskUnits
        .where(\ru -> match(ru))
        .flatMap(\ru -> ru.Coverages)
        .where(\coverage -> coverage.Type == coverageType)
  }

  private function findPolicyLevelCoveragesByType(coverageType: CoverageType): Coverage[] {
    return _incident.Claim.Policy.Coverages
        .where(\c -> c.Type == coverageType)
  }
}