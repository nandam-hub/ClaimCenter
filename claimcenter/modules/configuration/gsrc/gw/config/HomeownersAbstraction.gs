package gw.config

/**
 * Abstraction for support of Homeowners Line of Business specific typecodes.
 */
@Export
final class HomeownersAbstraction {

  // public instantiation prohibited
  protected construct() {
  }

  /**
   * Returns the coverage type typecode for Homeowners Dwelling coverage.
   *
   * @param policy used as reference
   * @return requested typecode or null if given Policy is null
   */
  public static function getDwellingCoverageType(final policy: Policy): CoverageType {
    if (policy == null) {
      return null
    }

    return CoverageType.TC_HOPCOVA
  }

  /**
   * Returns the coverage type typecode for Homeowners Other Structures coverage.
   *
   * @param policy used as reference
   * @return requested typecode or null if given Policy is null
   */
  public static function getOtherStructuresCoverageType(final policy: Policy): CoverageType {
    if (policy == null) {
      return null
    }

    return CoverageType.TC_HOPCOVB
  }

  /**
   * Returns the coverage type typecode for Homeowners Personal Property coverage.
   *
   * @param policy used as reference
   * @return requested typecode or null if given Policy is null
   */
  public static function getPersonalPropertyCoverageType(final policy: Policy): CoverageType {
    if (policy == null) {
      return null
    }

    return CoverageType.TC_HOPCOVC
  }

  /**
   * Returns the coverage type typecode for Homeowners Loss-of-Use coverage.
   *
   * @param policy used as reference
   * @return requested typecode or null if given Policy is null
   */
  public static function getLossOfUseCoverageType(final policy: Policy): CoverageType {
    if (policy == null) {
      return null
    }

    return CoverageType.TC_HOPCOVD
  }

  /**
   * Returns the coverage type typecode for Homeowners Personal Liability coverage.
   *
   * @param policy used as reference
   * @return requested typecode or null if given Policy is null
   */
  public static function getPersonalLiabilityCoverageType(final policy: Policy): CoverageType {
    if (policy == null) {
      return null
    }

    return CoverageType.TC_HOPCOVE
  }

  /**
   * Returns the coverage subtype typecode for Homeowners Personal Property coverage.
   *
   * @param policy used as reference
   * @return requested typecode or null if given Policy is null
   */
  public static function getPersonalPropertyCoverageSubtype(final policy: Policy): CoverageSubtype {
    if (policy == null) {
      return null
    }

    return CoverageSubtype.TC_HOPCOVC
  }

  /**
   * Returns the coverage subtype typecode for Homeowners Personal Liability - Property Damage coverage.
   *
   * @param policy used as reference
   * @return requested typecode or null if given Policy is null
   */
  public static function getPersonalLiabilityPDCoverageSubtype(final policy : Policy) : CoverageSubtype {
    if (policy == null) {
      return null
    }

    return CoverageSubtype.TC_HOPCOVEPD
  }
}