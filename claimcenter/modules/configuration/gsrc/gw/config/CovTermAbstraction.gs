package gw.config

@Export
final class CovTermAbstraction {
  // instantiation prohibited
  protected construct() {
  }

  /**
   * Set that defines the policy types that support multiple deductible covterms.
   */
  protected static var _multiDedCovTermSupportedPolicyType: Set<PolicyType> = {
      PolicyType.TC_HOPHOMEOWNERS,
      PolicyType.TC_COMMERCIALPROPERTY,
      PolicyType.TC_BUSINESSOWNERS
  }

  /**
   * Map that defines the default covterm patten for a given coverage type.
   * Coverage types are keys and covterm patterns are values.
   * For any coverage type, it should be in at most one entry as key.
   */
  protected static var _defaultCovTermPattern: Map<CoverageType, CovTermPattern> = {
      CoverageType.TC_HOPSECTIONIDEDUCTIBLES->CovTermPattern.TC_HOPSECTIONIDEDUCTIBLESOTHERPERILS,
      CoverageType.TC_CPBPPCOV->CovTermPattern.TC_CPBPPCOVDEDUCTIBLE,
      CoverageType.TC_CPBLDGCOV->CovTermPattern.TC_CPBLDGCOVDEDUCTIBLE,
      CoverageType.TC_CPBLDGSTOCKCOV->CovTermPattern.TC_CPBLDGSTOCKCOVDEDUCTIBLE,
      CoverageType.TC_BOPPROPERTYCOV->CovTermPattern.TC_BOPBASEDED
  }

  /**
   * returns whether the given policy type supports multiple deductible covterms handling
   *
   * @param policyType
   * @return true if the set contains the given policy type, or false if it does not
   */
  public static function isMultiDedCovTermSupported(final policyType: PolicyType): boolean {
    return _multiDedCovTermSupportedPolicyType.contains(policyType)
  }

  /**
   * returns the default covterm based on entries in the map
   *
   * @param coverage
   * @return requested covterm or null if given coverage is null
   */
  public static function getDefaultCovTerm(final coverage: Coverage): CovTerm {
    if (coverage.Type == null) {
      return null
    }
    var defaultCovTerm = coverage.CovTerms.firstWhere(\ct -> ct.CovTermPattern == _defaultCovTermPattern[coverage.Type])
    return defaultCovTerm
  }
}