package gw.config

/**
 * <p>Abstraction between Line of Business typecodes and their
 * usages in configuration.  This centralizes configurability and arbitration of the following typelists:</p>
 * <ul></ul><li>PolicyType</li>
 * <li>LOBCode</li>
 * <li>LossType</li></ul>
 *
 */
@Export
final class LOBAbstraction {


  /**
   * The code used for modes in PCF Configuration representing Homeowners PolicyType.
   */
  protected static final var UIMODE_HOMEOWNERS : String = "homeowners"

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // Below are arbitrary tags used to abstract out the various type codes. When adding or removing a
  // typecode, add or remove corresponding tags. The value of the tag isn't important, only that they be
  // unique and distinct from other tag values of the same typelist it represents. These values are used
  // only within this class.
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  //
  // Tags that map policy types
  //
  protected static final var POLICYTYPE_HOP: String = "hopline"
  protected static final var POLICYTYPE_PERSONALAUTO: String = "personalauto"
  protected static final var POLICYTYPE_WORKCOMP: String = "workcomp"
  protected static final var POLICYTYPE_GL: String = "gl"
  protected static final var POLICYTYPE_COMMPACKAGE: String = "cp"
  protected static final var POLICYTYPE_BUSINESSAUTO: String = "pt_businessauto"
  protected static final var POLICYTYPE_COMMPROP: String = "pt_commprop"
  protected static final var POLICYTYPE_BUSINESSOWNERS: String = "pt_businessowners"
  protected static final var POLICYTYPE_FARM: String = "pt_farm"
  protected static final var POLICYTYPE_IM: String = "pt_im"
  protected static final var POLICYTYPE_PERSONALUMBRELLA: String = "pt_umbrella"
  protected static final var POLICYTYPE_PROF_LIAB: String = "pt_profliab"
  protected static final var POLICYTYPE_PERTRAVEL: String = "pt_trav"

  //
  // Tags that map LOBCodes
  //
  protected static final var LOB_OTHER_LIAB : String = "lob_ol"
  protected static final var LOB_GLLINE: String = "lob_gl"
  protected static final var LOB_TRAVEL: String = "lob_trav"
  protected static final var LOB_PERSONAL_UMBRELLA: String = "lob_pum"
  protected static final var LOB_BOPLINE: String = "lob_bop"
  protected static final var LOB_HOPLINE: String = "lob_hop"
  protected static final var LOB_CPLINE: String = "lob_cp"
  protected static final var LOB_IMLINE: String = "lob_im"
  protected static final var LOB_BUSINESSAUTOLINE: String = "lob_ca"
  protected static final var LOB_PERSONALAUTOLINE: String = "lob_pa"
  protected static final var LOB_WORKERSCOMPLINE: String = "lob_wc"

  //
  // Tags that map LossTypes
  //
  protected static final var LOSSTYPE_AUTO: String = "lt_auto"
  protected static final var LOSSTYPE_GL: String = "lt_gl"
  protected static final var LOSSTYPE_PR: String = "lt_pr"
  protected static final var LOSSTYPE_TRAVEL: String = "lt_trav"
  protected static final var LOSSTYPE_WC: String = "lt_wc"

  /**
   * Map of LossType typecode abstractions.
   */
  protected static var _lossTypeMap : Map<String, LossTypeMappedProperties> = {
      // Auto
      LOSSTYPE_AUTO -> new LossTypeMappedProperties() {
        override property get LossType(): typekey.LossType { return typekey.LossType.TC_AUTO }
      },

      // General Liability
      LOSSTYPE_GL -> new LossTypeMappedProperties() {
        override property get LossType(): typekey.LossType { return typekey.LossType.TC_GL }
      },

      // Property
      LOSSTYPE_PR -> new LossTypeMappedProperties() {
        override property get LossType(): typekey.LossType { return typekey.LossType.TC_PR }
      },

      // Travel
      LOSSTYPE_TRAVEL -> new LossTypeMappedProperties() {
        override property get LossType(): typekey.LossType { return typekey.LossType.TC_TRAV }
      },

      // Worker's Comp
      LOSSTYPE_WC -> new LossTypeMappedProperties() {
        override property get LossType(): typekey.LossType { return typekey.LossType.TC_WC }
      }
  }

  /**
   * Map of LOBCode typecode abstractions.
   */
  protected static var _lobCodeMap : Map<String, LOBCode> = {
      // Worker's Comp
      LOB_WORKERSCOMPLINE -> LOBCode.TC_WORKERSCOMPLINE,

      // Personal Auto
      LOB_PERSONALAUTOLINE -> LOBCode.TC_PERSONALAUTOLINE,

      // Commercial Auto
      LOB_BUSINESSAUTOLINE -> LOBCode.TC_BUSINESSAUTOLINE,

      // Inland Marine
      LOB_IMLINE -> LOBCode.TC_IMLINE,

      // Commercial Property
      LOB_CPLINE -> LOBCode.TC_CPLINE,

      // HOP Homeowners
      LOB_HOPLINE -> LOBCode.TC_HOPLINE,

      // Other Liability
      LOB_OTHER_LIAB -> LOBCode.TC_OTHER_LIAB,

      // General Liability
      LOB_GLLINE -> LOBCode.TC_GLLINE,

      // Travel
      LOB_TRAVEL -> LOBCode.TC_TRAVEL,

      // Personal Umbrella
      LOB_PERSONAL_UMBRELLA -> LOBCode.TC_PERSONALUMBRELLALINE_PUE,

      // Businessowners
      LOB_BOPLINE -> LOBCode.TC_BOPLINE
  }

  /**
   * Map of PolicyType typecode abstractions.
   */
  final protected static var _policyTypeMap : Map<String, PolicyTypeMappedProperties> = {

      // Personal Auto Line
      POLICYTYPE_PERSONALAUTO -> new PolicyTypeMappedProperties() {
        override property get PolicyType(): typekey.PolicyType { return typekey.PolicyType.TC_PERSONALAUTO }
      },

      // Homeowners (HOP) Line
      POLICYTYPE_HOP -> new PolicyTypeMappedProperties() {
        override property get PolicyType(): typekey.PolicyType { return typekey.PolicyType.TC_HOPHOMEOWNERS }
        override property get UIMode(): String { return UIMODE_HOMEOWNERS }
      },

      // Worker's Comp Line
      POLICYTYPE_WORKCOMP -> new PolicyTypeMappedProperties() {
        override property get PolicyType(): typekey.PolicyType { return typekey.PolicyType.TC_WORKERSCOMP }
      },

      // General Liability Line
      POLICYTYPE_GL -> new PolicyTypeMappedProperties() {
        override property get PolicyType(): typekey.PolicyType { return typekey.PolicyType.TC_GENERALLIABILITY }
      },

      // Commercial Package Line
      POLICYTYPE_COMMPACKAGE -> new PolicyTypeMappedProperties() {
        override property get PolicyType(): typekey.PolicyType { return typekey.PolicyType.TC_COMMERCIALPACKAGE }
      },

      // Business Auto Line
      POLICYTYPE_BUSINESSAUTO -> new PolicyTypeMappedProperties() {
        override property get PolicyType(): typekey.PolicyType { return typekey.PolicyType.TC_BUSINESSAUTO }
      },

      // Commercial Property Line
      POLICYTYPE_COMMPROP -> new PolicyTypeMappedProperties() {
        override property get PolicyType(): typekey.PolicyType { return typekey.PolicyType.TC_COMMERCIALPROPERTY }
      },

      // Business Owners Line
      POLICYTYPE_BUSINESSOWNERS -> new PolicyTypeMappedProperties() {
        override property get PolicyType(): typekey.PolicyType { return typekey.PolicyType.TC_BUSINESSOWNERS }
      },

      // Farmowners Line
      POLICYTYPE_FARM -> new PolicyTypeMappedProperties() {
        override property get PolicyType(): typekey.PolicyType { return typekey.PolicyType.TC_FARMOWNERS }
      },

      // Inland Marine Line
      POLICYTYPE_IM -> new PolicyTypeMappedProperties() {
        override property get PolicyType(): typekey.PolicyType { return typekey.PolicyType.TC_INLANDMARINE }
      },

      // Personal Umbrella Line
      POLICYTYPE_PERSONALUMBRELLA -> new PolicyTypeMappedProperties() {
        override property get PolicyType(): typekey.PolicyType { return typekey.PolicyType.TC_PERSONALUMBRELLA }
      },

      // Professional Liability Line
      POLICYTYPE_PROF_LIAB -> new PolicyTypeMappedProperties() {
        override property get PolicyType(): typekey.PolicyType { return typekey.PolicyType.TC_PROF_LIABILITY }
      },

      // Travel Line
      POLICYTYPE_PERTRAVEL-> new PolicyTypeMappedProperties() {
        override property get PolicyType(): typekey.PolicyType { return typekey.PolicyType.TC_TRAVEL_PER }
      }
  }

  final protected static var _policyTypeToIcon : Map<PolicyType, String> =  {
      PolicyType.TC_BUSINESSAUTO -> "commercial_auto",
      PolicyType.TC_COMMERCIALPACKAGE -> "commercial_package",
      PolicyType.TC_COMMERCIALPROPERTY -> "commercial_building",
      PolicyType.TC_GENERALLIABILITY -> "general_liability",
      PolicyType.TC_HOPHOMEOWNERS -> "homeowners",
      PolicyType.TC_INLANDMARINE -> "inland_marine",
      PolicyType.TC_PERSONALAUTO -> "personal_auto",
      PolicyType.TC_TRAVEL_PER -> "travel",
      PolicyType.TC_PERSONALUMBRELLA -> "homeowners",
      PolicyType.TC_WORKERSCOMP -> "workers_comp",
      PolicyType.TC_BUSINESSOWNERS -> "businessowner"
  }

  // instantiation prohibited
  protected construct() {}

  /**
   * Container for abstracted properties for a given PolicyType typecode.
   */
  protected abstract static class PolicyTypeMappedProperties {
    public abstract property get PolicyType() : typekey.PolicyType
    public property get UIMode() : String { return this.PolicyType.Code }
  }

  /**
   * Container for abstracted properties for a give LossType typecode.
   */
  protected abstract static class LossTypeMappedProperties {
    public abstract property get LossType() : typekey.LossType
    public property get UIMode() : String { return LossType.Code }
  }

  /**
   * Abstractions related to Policies.
   */
  public static final class ForPolicy {

    // instantiation prohibited
    protected construct() {}

    /**
     * Provides Homeowners LOB-specific typecode abstractions.
     */
    final public static var _homeownersAbstraction : HomeownersAbstraction as readonly ForHomeowners = new HomeownersAbstraction()

    /**
     * Returns the PolicyType typecode for Personal Auto.
     */
    public static property get PersonalAutoPolicyType() : PolicyType { return _policyTypeMap.get(POLICYTYPE_PERSONALAUTO).PolicyType }

    /**
     * Returns the PolicyType typecode for Commercial Auto.
     */
    public static property get CommercialAutoPolicyType() : PolicyType { return _policyTypeMap.get(POLICYTYPE_BUSINESSAUTO).PolicyType }

    /**
     * Returns the PolicyType typecode for Businessowners.
     */
    public static property get BusinessOwnersPolicyType() : PolicyType { return _policyTypeMap.get(POLICYTYPE_BUSINESSOWNERS).PolicyType }

    /**
     * Returns the PolicyType typecode for Commercial Package.
     */
    public static property get CommercialPackagePolicyType() : PolicyType { return _policyTypeMap.get(POLICYTYPE_COMMPACKAGE).PolicyType }

    /**
     * Returns the PolicyType typecode for Commercial Property.
     */
    public static property get CommercialPropertyPolicyType() : PolicyType { return _policyTypeMap.get(POLICYTYPE_COMMPROP).PolicyType }

    /**
     * Returns the PolicyType typecode for Farmowners.
     */
    public static property get FarmownersPolicyType() : PolicyType { return _policyTypeMap.get(POLICYTYPE_FARM).PolicyType }

    /**
     * Returns the PolicyType typecode for General Liability.
     */
    public static property get GeneralLiablityPolicyType() : PolicyType { return _policyTypeMap.get(POLICYTYPE_GL).PolicyType }

    /**
     * Returns the PolicyType typecode for Homeowners.
     */
    public static property get HOPPolicyType() : PolicyType { return _policyTypeMap.get(POLICYTYPE_HOP).PolicyType }

    /**
     * Returns the PolicyType typecode for Inland Marine.
     */
    public static property get InlandMarinePolicyType() : PolicyType { return _policyTypeMap.get(POLICYTYPE_IM).PolicyType }

    /**
     * Returns the PolicyType typecode for Personal Umbrella.
     */
    public static property get PersonalUmbrellaPolicyType() : PolicyType { return _policyTypeMap.get(POLICYTYPE_PERSONALUMBRELLA).PolicyType }

    /**
     * Returns the PolicyType typecode for Professional Liability.
     */
    public static property get ProfessionalLiabilityPolicyType() : PolicyType { return _policyTypeMap.get(POLICYTYPE_PROF_LIAB).PolicyType }

    /**
     * Returns the PolicyType typecode for Personal Travel.
     */
    public static property get PersonalTravelPolicyType() : PolicyType { return _policyTypeMap.get(POLICYTYPE_PERTRAVEL).PolicyType }

    /**
     * Returns the PolicyType typecode for Worker's Compensation.
     */
    public static property get WorkCompPolicyType() : PolicyType { return _policyTypeMap.get(POLICYTYPE_WORKCOMP).PolicyType }


    /**
     * Returns true if a given Policy is a Personal Auto Policy
     */
    public static function isProfLiabilityPolicy(final policy: entity.Policy): boolean {
      return assessMatchingPolicyTypeForPolicy(policy, POLICYTYPE_PROF_LIAB)
    }

    /**
     * Returns true if a given Policy is a Farmowners Policy
     */
    public static function isFarmownersPolicy(final policy: entity.Policy): boolean {
      return assessMatchingPolicyTypeForPolicy(policy, POLICYTYPE_FARM)
    }

    /**
     * Returns true if a given Policy is a General Liability Policy
     */
    public static function isGeneralLiabilityPolicy(final policy: entity.Policy): boolean {
      return assessMatchingPolicyTypeForPolicy(policy, POLICYTYPE_GL)
    }

    /**
     * Returns true if a given Policy is a Personal Umbrella Policy
     */
    public static function isPersonalUmbrellaPolicy(final policy: entity.Policy): boolean {
      return assessMatchingPolicyTypeForPolicy(policy, POLICYTYPE_PERSONALUMBRELLA)
    }

    /**
     * Returns true if a given Policy is a Commercial Package Policy
     */
    public static function isCommercialPackagePolicy(final policy: entity.Policy): boolean {
      return assessMatchingPolicyTypeForPolicy(policy, POLICYTYPE_COMMPACKAGE)
    }

    /**
     * Returns true if a given Policy is a Personal Auto Policy
     */
    public static function isPersonalAutoPolicy(final policy: entity.Policy): boolean {
      return assessMatchingPolicyTypeForPolicy(policy, POLICYTYPE_PERSONALAUTO)
    }

    /**
     * Returns true if a given Policy is a Commercial Auto Policy
     */
    public static function isCommercialAutoPolicy(final policy: entity.Policy): boolean {
      return assessMatchingPolicyTypeForPolicy(policy, POLICYTYPE_BUSINESSAUTO)
    }

    /**
     * Returns true if a given Policy is a Worker's Compensation Policy
     */
    public static function isWorkersCompPolicy(final policy: entity.Policy): boolean {
      return assessMatchingPolicyTypeForPolicy(policy, POLICYTYPE_WORKCOMP)
    }

    /**
     * Returns true if this is a Commercial Property Policy
     */
    public static function isCommercialPropertyPolicy(final policy: entity.Policy): boolean {
      return assessMatchingPolicyTypeForPolicy(policy, POLICYTYPE_COMMPROP)
    }

    /**
     * Returns true if this is a Business Owners Policy
     */
    public static function isBusinessOwnersPolicy(final policy: entity.Policy): boolean {
      return assessMatchingPolicyTypeForPolicy(policy, POLICYTYPE_BUSINESSOWNERS)
    }

    /**
     * Returns true if a given Policy is a Travel Policy
     */
    public static function isPersonalTravelPolicy(final policy: entity.Policy): boolean {
      return assessMatchingPolicyTypeForPolicy(policy, POLICYTYPE_PERTRAVEL)
    }

    /**
     * Returns true if this is an Inland Marine Policy
     */
    public static function isInlandMarinePolicy(final policy: entity.Policy): boolean {
      return assessMatchingPolicyTypeForPolicy(policy, POLICYTYPE_IM)
    }

    /**
     * Returns true if a given Policy is a Homeowner's Policy
     */
    public static function isHomeownersPolicy(final policy: entity.Policy): boolean {
      return assessMatchingPolicyTypeForPolicy(policy, POLICYTYPE_HOP)
    }

    protected static function assessMatchingPolicyTypeForPolicy(final policy : entity.Policy, final code : String) : boolean {
      if (policy != null) {
        return _policyTypeMap.get(code).PolicyType == policy.PolicyType
      }

      return false
    }

    /**
     * Determines the mode identifier to use to switch in specific UI pages, sheets
     * and views based on this Policy's PolicyType. If a PolicyType is not registered, the PolicyType code
     * of the given Policy is returned. If given policy is NULL, then NULL is returned.
     *
     * @return mode identifier for use by the UI
     *
     */
    public static function getUIMode(final policy: entity.Policy): String {
      if (policy != null) {
        for (p in _policyTypeMap.values()) {
          if (p.PolicyType == policy.PolicyType) {
            return p.UIMode
          }
        }

        return policy.PolicyType.Code
      }

      return null
    }

    public static property get PolicyTypeToIcon() : Map<PolicyType, String> {
      return _policyTypeToIcon
    }
  }

  /**
   * Abstractions related to Claims.
   */
  public static final class ForClaim {

    /**
     * Abstractions for Loss Type.
     */
    public static final class ForLossType {

      /**
       * Returns typecode for Auto LossType.
       */
      public static property get Auto(): LossType {
        return _lossTypeMap.get(LOSSTYPE_AUTO).LossType
      }

      /**
       * Returns typecode for Property LossType.
       */
      public static property get Property(): LossType {
        return _lossTypeMap.get(LOSSTYPE_PR).LossType
      }

      /**
       * Returns typecode for General Liability LossType.
       */
      public static property get GeneralLiability(): LossType {
        return _lossTypeMap.get(LOSSTYPE_GL).LossType
      }

      /**
       * Returns typecode for Worker's Compensation LossType.
       */
      public static property get WorkComp(): LossType {
        return _lossTypeMap.get(LOSSTYPE_WC).LossType
      }

      /**
       * Returns typecode for Travel LossType.
       */
      public static property get Travel(): LossType {
        return _lossTypeMap.get(LOSSTYPE_TRAVEL).LossType
      }

      /**
       * Validates whether a given claim is of the LossType Auto.
       *
       * @param claim the Claim to validate
       * @return true if given claim is an Auto claim, false otherwise
       */
      public static function isAuto(final claim: entity.Claim): boolean {
        return assessMatchingLossType(claim, LOSSTYPE_AUTO)
      }

      /**
       * Validates whether a given claim is of the LossType Property.
       *
       * @param claim the Claim to validate
       * @return true if given claim is an Property claim, false otherwise
       */
      public static function isProperty(final claim: entity.Claim): boolean {
        return assessMatchingLossType(claim, LOSSTYPE_PR)
      }

      /**
       * Validates whether a given claim is of the LossType Worker's Compensation.
       *
       * @param claim the Claim to validate
       * @return true if given claim is an WorkComp claim, false otherwise
       */
      public static function isWorkComp(final claim: entity.Claim): boolean {
        return assessMatchingLossType(claim, LOSSTYPE_WC)
      }

      /**
       * Validates whether a given claim is of the LossType General Liability.
       *
       * @param claim the Claim to validate
       * @return true if given claim is an GL claim, false otherwise
       */
      public static function isGeneralLiablity(final claim: entity.Claim): boolean {
        return assessMatchingLossType(claim, LOSSTYPE_GL)
      }

      /**
       * Validates whether a given claim is of the LossType Travel.
       *
       * @param claim the Claim to validate
       * @return true if given claim is a Travel claim, false otherwise
       */
      public static function isTravel(final claim: entity.Claim): boolean {
        return assessMatchingLossType(claim, LOSSTYPE_TRAVEL)
      }

      /**
       * Determines the UI mode identifier for a given claim. The identifier is based on the Claim's LossType.
       * This identifier is use as the value used by the mode attribute of Pages, Panels, Detail Views, etc.
       * If the identifier is explicitly declared, the LossType code will be returned. If the given Claim is NULL,
       * then NULL is returned.
       *
       * @param claim the Claim to determine the proper UI mode identifier for.
       * @return the determined UI mode identifier
       */
      public static function getUIMode(final claim : entity.Claim) : String {
        if (claim != null) {
          for (p in _lossTypeMap.values()) {
            if (claim.LossType == p.LossType) {
              return p.UIMode
            }
          }

          return claim.LossType.Code
        }

        return null
      }

      protected static function assessMatchingLossType(final claim: entity.Claim, final lossTypeCode: String): boolean {
        if (claim != null) {
          var properties = _lossTypeMap.get(lossTypeCode)
          if (properties != null) {
            return claim.LossType == properties.LossType
          }
        }

        return false
      }

    }

    /**
     * Abstractions for LOB Code.
     */
    public static final class ForLOB {
      
      /**
       * Returns the LOBCode typecode for Personal Auto LOB
       */
      public static property get PersonalAuto(): LOBCode {
        return _lobCodeMap.get(LOB_PERSONALAUTOLINE)
      }
      
      /**
       * Returns the LOBCode typecode for Business Owners LOB
       */
      public static property get Businessowners(): LOBCode {
        return _lobCodeMap.get(LOB_BOPLINE)
      }

      /**
       * Returns the LOBCode typecode for Commercial Auto LOB
       */
      public static property get CommercialAuto(): LOBCode {
        return _lobCodeMap.get(LOB_BUSINESSAUTOLINE)
      }

      /**
       * Returns the LOBCode typecode for Commercial Property LOB
       */
      public static property get CommercialProperty(): LOBCode {
        return _lobCodeMap.get(LOB_CPLINE)
      }

      /**
       * Returns the LOBCode typecode for General Liability LOB
       */
      public static property get GeneralLiability(): LOBCode {
        return _lobCodeMap.get(LOB_GLLINE)
      }

      /**
       * Returns the LOBCode typecode for Homeowners (HOP) LOB
       */
      public static property get HOPLine(): LOBCode {
        return _lobCodeMap.get(LOB_HOPLINE)
      }

      /**
       * Returns the LOBCode typecode for Inland Marine LOB
       */
      public static property get InlandMarine(): LOBCode {
        return _lobCodeMap.get(LOB_IMLINE)
      }

      /**
       * Returns the LOBCode typecode for Other Liability LOB
       */
      public static property get OtherLiability(): LOBCode {
        return _lobCodeMap.get(LOB_OTHER_LIAB)
      }

      /**
       * Returns the LOBCode typecode for Personal Umbrella LOB
       */
      public static property get PersonalUmbrella(): LOBCode {
        return _lobCodeMap.get(LOB_PERSONAL_UMBRELLA)
      }

      /**
       * Returns the LOBCode typecode for Travel LOB
       */
      public static property get Travel(): LOBCode {
        return _lobCodeMap.get(LOB_TRAVEL)
      }

      /**
       * Returns the LOBCode typecode for Worker's Compensation LOB
       */
      public static property get WorkComp(): LOBCode {
        return _lobCodeMap.get(LOB_WORKERSCOMPLINE)
      }

      /**
       * Validates whether the Line of Business (LOB) of a given claim is Worker's Compensation. The claim
       * must have an LOBCode of WorkComp and matching PolicyType of WorkComp.
       *
       * @param claim The Claim in which to validate.
       * @return true is the claim is WorkComp LOB, false otherwise.
       */
      public static function isWorkCompLine(final claim: entity.Claim): boolean {
        return assessMatchingLOB(claim, POLICYTYPE_WORKCOMP, LOB_WORKERSCOMPLINE)
      }

      /**
       * Validates whether the Line of Business (LOB) of a given claim is Personal Auto. The claim
       * must have an LOBCode of Personal Auto and matching PolicyType of Personal Auto.
       *
       * @param claim The Claim in which to validate.
       * @return true is the claim is Personal Auto LOB, false otherwise.
       */
      public static function isPersonalAutoLine(final claim: entity.Claim): boolean {
        return assessMatchingLOB(claim, POLICYTYPE_PERSONALAUTO, LOB_PERSONALAUTOLINE)
      }

      /**
       * Validates whether the Line of Business (LOB) of a given claim is Commercial Auto. The claim
       * must have an LOBCode of Commercial Auto and matching PolicyType of Commercial Auto.
       *
       * @param claim The Claim in which to validate.
       * @return true is the claim is Commercial Auto LOB, false otherwise.
       */
      public static function isCommercialAutoLine(final claim: entity.Claim): boolean {
        return assessMatchingLOB(claim, POLICYTYPE_BUSINESSAUTO, LOB_BUSINESSAUTOLINE)
      }

      /**
       * Validates whether the Line of Business (LOB) of a given claim is Commercial Property. The claim
       * must have an LOBCode of Commercial Property and matching PolicyType of Commercial Property.
       *
       * @param claim The Claim in which to validate.
       * @return true is the claim is Commercial Property LOB, false otherwise.
       */
      public static function isCommercialPropertyLine(final claim: entity.Claim): boolean {
        return assessMatchingLOB(claim, POLICYTYPE_COMMPROP, LOB_CPLINE)
      }

      /**
       * Validates whether the Line of Business (LOB) of a given claim is Commercial Property - Commercial Package. The claim
       * must have an LOBCode of Commercial Property and matching PolicyType of Commercial Package.
       *
       * @param claim The Claim in which to validate.
       * @return true is the claim is Commercial Property - Commercial Package LOB, false otherwise.
       */
      public static function isCommercialPropertyLineForCommPackagePolicy(final claim: entity.Claim): boolean {
        return assessMatchingLOB(claim, POLICYTYPE_COMMPACKAGE, LOB_CPLINE)
      }

      /**
       * Validates whether the Line of Business (LOB) of a given claim is General Liability. The claim
       * must have an LOBCode of GL and matching PolicyType of GL.
       *
       * @param claim The Claim in which to validate.
       * @return true is the claim is GL LOB, false otherwise.
       */
      public static function isGeneralLiabilityLine(final claim: entity.Claim): boolean {
        return assessMatchingLOB(claim, POLICYTYPE_GL, LOB_GLLINE)
      }

      /**
       * Validates whether the Line of Business (LOB) of a given claim is General Liability - Commercial Package. The claim
       * must have an LOBCode of GL and matching PolicyType of Commercial Package.
       *
       * @param claim The Claim in which to validate.
       * @return true is the claim is General Liability - Commercial Package LOB, false otherwise.
       */
      public static function isGeneralLiabilityLineForCommPackagePolicy(final claim: entity.Claim): boolean {
        return assessMatchingLOB(claim, POLICYTYPE_COMMPACKAGE, LOB_GLLINE)
      }

      /**
       * Validates whether the Line of Business (LOB) of a given claim is Businessowners. The claim
       * must have an LOBCode of Businessowners and matching PolicyType of Businessowners.
       *
       * @param claim The Claim in which to validate.
       * @return true is the claim is Businessowners LOB, false otherwise.
       */
      public static function isBusinessOwnersLine(final claim: entity.Claim): boolean {
        return assessMatchingLOB(claim, POLICYTYPE_BUSINESSOWNERS, LOB_BOPLINE)
      }

      /**
       * Validates whether the Line of Business (LOB) of a given claim is Inland Marine. The claim
       * must have an LOBCode of Inland Marine and matching PolicyType of Inland Marine.
       *
       * @param claim The Claim in which to validate.
       * @return true is the claim is Inland Marine LOB, false otherwise.
       */
      public static function isInlandMarineLine(final claim: entity.Claim): boolean {
        return assessMatchingLOB(claim, POLICYTYPE_IM, LOB_IMLINE)
      }

      /**
       * Validates whether the Line of Business (LOB) of a given claim is Inland Marine - Commercial Property. The claim
       * must have an LOBCode of Inland Marine and matching PolicyType of Commercial Package.
       *
       * @param claim The Claim in which to validate.
       * @return true is the claim is Inland Marine - Commercial Property LOB, false otherwise.
       */
      public static function isInlandMarineLineForCommPackagePolicy(final claim: entity.Claim): boolean {
        return assessMatchingLOB(claim, POLICYTYPE_COMMPACKAGE, LOB_IMLINE)
      }

      /**
       * Validates whether the Line of Business (LOB) of a given claim is Personal Umbrella. The claim
       * must have an LOBCode of Personal Umbrella and matching PolicyType of Personal Umbrella.
       *
       * @param claim The Claim in which to validate.
       * @return true is the claim is Personal Umbrella LOB, false otherwise.
       */
      public static function isPersonalUmbrellaLine(final claim: entity.Claim): boolean {
        return assessMatchingLOB(claim, POLICYTYPE_PERSONALUMBRELLA, LOB_PERSONAL_UMBRELLA)
      }

      /**
       * Validates whether the Line of Business (LOB) of a given claim is Personal Travel. The claim
       * must have an LOBCode of Personal Travel and matching PolicyType of Travel.
       *
       * @param claim The Claim in which to validate.
       * @return true is the claim is Personal Travel LOB, false otherwise.
       */
      public static function isTravelLine(final claim: entity.Claim): boolean {
        return assessMatchingLOB(claim, POLICYTYPE_PERTRAVEL, LOB_TRAVEL)
      }

      /**
       * Validates whether the Line of Business (LOB) of a given claim is Farmowners. The claim
       * must have an LOBCode of Other Liability and matching PolicyType of Farmowners.
       *
       * @param claim The Claim in which to validate.
       * @return true is the claim is Farmowners LOB, false otherwise.
       */
      public static function isOtherLiabilityLineForFarmownersPolicy(final claim: entity.Claim): boolean {
        return assessMatchingLOB(claim, POLICYTYPE_FARM, LOB_OTHER_LIAB)
      }

      /**
       * Validates whether the Line of Business (LOB) of a given claim is Other Liability - General Liability. The claim
       * must have an LOBCode of Other Liability and matching PolicyType of GL.
       *
       * @param claim The Claim in which to validate.
       * @return true is the claim is Other Liability - GL LOB, false otherwise.
       */
      public static function isOtherLiabilityLineForGeneralLiabilityPolicy(final claim: entity.Claim): boolean {
        return assessMatchingLOB(claim, POLICYTYPE_GL, LOB_OTHER_LIAB)
      }

      /**
       * Validates whether the Line of Business (LOB) of a given claim is Homeowners. The claim
       * must have an LOBCode of Homeowners and matching PolicyType of Homeowners.
       *
       * @param claim The Claim in which to validate.
       * @return true is the claim is Homeowners LOB, false otherwise.
       */
      public static function isHomeownersLine(final claim: entity.Claim): boolean {
        return assessMatchingLOB(claim, POLICYTYPE_HOP, LOB_HOPLINE)
      }

      protected static function assessMatchingLOB(final claim: entity.Claim, final policyMapCode: String, final lobMapCode: String): boolean {
        if (claim != null) {
          var lobCode = _lobCodeMap.get(lobMapCode)
          if (claim.LOBCode == lobCode) {
            return ForPolicy.assessMatchingPolicyTypeForPolicy(claim.Policy, policyMapCode)
          }
        }

        return false
      }
    }

    // instantiation prohibited
    protected construct() {}
  }

}