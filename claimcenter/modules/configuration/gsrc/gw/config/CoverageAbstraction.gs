package gw.config

/**
 * Abstraction of the relationships between coverages.
 */
@Export
final class CoverageAbstraction {

  // instantiation prohibited
  protected construct() {
  }

  /**
   * Map that defines the relationship between coverages.
   * Subordinate coverages are keys and Master coverages are values.
   * For any given coverage type, it should be in at most one entry as key.
   */
  protected static var _coverageTypeMap: Map<CoverageType, CoverageType> = {
      CoverageType.TC_HOPCOVA->CoverageType.TC_HOPSECTIONIDEDUCTIBLES,
      CoverageType.TC_HOPCOVB->CoverageType.TC_HOPSECTIONIDEDUCTIBLES,
      CoverageType.TC_HOPCOVC->CoverageType.TC_HOPSECTIONIDEDUCTIBLES,
      CoverageType.TC_HOPVOLCANICACTION->CoverageType.TC_HOPSECTIONIDEDUCTIBLES,
      CoverageType.TC_HOPDWELLINGUNDERCONSTRUCTION->CoverageType.TC_HOPSECTIONIDEDUCTIBLES
  }

  /**
   * Return the master coverage based on relationship between coverages
   *
   * @param coverage the subordinate coverage
   * @return the master coverage
   */
  public static function getMasterCoverage(final coverage: Coverage): Coverage {
    if (coverage.Type == null) {
      return null
    }
    var master = coverage.Policy.AllCoverages.firstWhere(\c -> c.Type == _coverageTypeMap[coverage.Type])
    return master
  }
}