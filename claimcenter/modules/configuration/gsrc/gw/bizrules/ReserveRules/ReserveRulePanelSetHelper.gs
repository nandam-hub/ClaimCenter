package gw.bizrules.ReserveRules

uses gw.api.locale.DisplayKey
uses gw.api.util.LOBUtil
uses gw.bizrules.CCRulePanelSetHelper
uses gw.entity.TypeKey
uses pcf.api.Location

/**
 * Helper class for the Reserve Rule Panel Set pcf
 */
@Export
class ReserveRulePanelSetHelper extends CCRulePanelSetHelper<ReserveRule> {

  construct(rule: ReserveRule, location: Location) {
    super(rule, location)
  }

  /**
   * RangeInput Bundle for the Loss Type Applicability Criteria
   */
  property get LossTypesBundle(): SingleSelectBundle {
    return new SingleSelectBundle(DisplayKey.get('Web.BizRules.Rule.ApplicabilityCriteria.LossType'),
        LossType.getTypeKeys(false).toTypedArray()) {
      override property get Selected(): TypeKey {
        return SelectedRuleSupplier.get().LossTypes*.LossType.first()
      }

      override property set Selected(selection: TypeKey) {
        SelectedRuleSupplier.get().LossTypes*.remove()
        addLossType(selection as LossType)

        var currentSelectedPolicyTypes = PolicyTypesBundle.Selected
        var newValidPolicyTypeRange = PolicyTypesBundle.Range
        if (not currentSelectedPolicyTypes.allMatch(\policyType -> newValidPolicyTypeRange.contains(policyType))) {
          PolicyTypesBundle.SelectorState = true
        }

        var currentSelectedExposureTypes = ExposureTypesBundle.Selected
        var newValidExposureTypeRange = ExposureTypesBundle.Range
        if (not currentSelectedExposureTypes.allMatch(\exposureType -> newValidExposureTypeRange.contains(exposureType))) {
          ExposureTypesBundle.SelectorState = true
        }

        var currentSelectedClaimSegments = ClaimSegmentsBundle.Selected
        var newValidClaimSegmentRange = ClaimSegmentsBundle.Range
        if (not currentSelectedClaimSegments.allMatch(\exposureType -> newValidClaimSegmentRange.contains(exposureType))) {
          ClaimSegmentsBundle.SelectorState = true
        }
      }

      private function addLossType(lossType: LossType) {
        var acLossType = new AppCritLossType()
        acLossType.LossType = lossType
        SelectedRuleSupplier.get().addToLossTypes(acLossType)
      }
    }
  }

  /**
   * Shuttle Bundle for the Policy Type Applicability Criteria
   */
  private var _policyTypesBundle: MultiSelectBundle as readonly PolicyTypesBundle =
      new MultiSelectBundle(DisplayKey.get('Web.BizRules.Rule.ApplicabilityCriteria.PolicyType'), null) {
        override property get Selected(): TypeKey[] {
          return SelectedRuleSupplier.get().PolicyTypes*.PolicyType.sort()
        }

        override property set Selected(selection: TypeKey[]) {
          SelectedRuleSupplier.get().PolicyTypes*.remove()
          selection
              .map(\p -> p as PolicyType)
              .toSet()
              .each(\policyType -> addPolicyType(policyType))

          var currentSelectedExposureTypes = ExposureTypesBundle.Selected
          var newValidExposureTypeRange = ExposureTypesBundle.Range
          if (not currentSelectedExposureTypes.allMatch(\exposureType -> newValidExposureTypeRange.contains(exposureType))) {
            ExposureTypesBundle.SelectorState = true
          }
        }

        override property get Range(): TypeKey[] {
          var selectedLossType = LossTypesBundle.Selected as LossType
          if (selectedLossType == null) {
            return {}
          }
          return LOBUtil.getPolicyTypes(selectedLossType)
              .toTypedArray()
        }

        private function addPolicyType(policyType: PolicyType) {
          var acPolicyType = new AppCritPolicyType()
          acPolicyType.PolicyType = policyType
          SelectedRuleSupplier.get().addToPolicyTypes(acPolicyType)
        }
      }

  /**
   * Shuttle Bundle for the Jurisdiction Applicability Criteria
   */
  property get JurisdictionsBundle(): MultiSelectBundle {
    return new MultiSelectBundle(DisplayKey.get('Web.BizRules.Rule.ApplicabilityCriteria.Jurisdiction'),
        Jurisdiction.getTypeKeys(false).toTypedArray()) {
      override property get Selected(): TypeKey[] {
        return SelectedRuleSupplier.get().Jurisdictions*.Jurisdiction.sort()
      }

      override property set Selected(selection: TypeKey[]) {
        SelectedRuleSupplier.get().Jurisdictions*.remove()
        selection
            .map(\e -> e as Jurisdiction)
            .toSet()
            .each(\jurisdiction -> addJurisdiction(jurisdiction))
      }

      private function addJurisdiction(jurisdiction: Jurisdiction) {
        var acJurisdiction = new AppCritJurisdiction()
        acJurisdiction.Jurisdiction = jurisdiction
        SelectedRuleSupplier.get().addToJurisdictions(acJurisdiction)
      }
    }
  }

  /**
   * Shuttle Bundle for the Exposure Type Applicability Criteria
   */
  private var _exposureTypesBundle: MultiSelectBundle as readonly ExposureTypesBundle =
      new MultiSelectBundle(DisplayKey.get('Web.BizRules.Rule.ApplicabilityCriteria.ExposureType'), null) {
        override property get Selected(): TypeKey[] {
          return SelectedRuleSupplier.get().ExposureTypes*.ExposureType.sort()
        }

        override property set Selected(selection: TypeKey[]) {
          SelectedRuleSupplier.get().ExposureTypes*.remove()
          selection
              .map(\e -> e as ExposureType)
              .toSet()
              .each(\exposureType -> addExposureType(exposureType))
        }

        override property get Range(): TypeKey[] {
          var selectedLossType = LossTypesBundle.Selected as LossType
          if (selectedLossType == null) {
            return {}
          }
          var selectedPolicyType = PolicyTypesBundle.Selected as PolicyType[]
          return LOBUtil.getExposureTypes(selectedLossType, selectedPolicyType).toTypedArray()
        }

        private function addExposureType(exposureType: ExposureType) {
          var acExposureType = new AppCritExposureType()
          acExposureType.ExposureType = exposureType
          SelectedRuleSupplier.get().addToExposureTypes(acExposureType)
        }
      }

  /**
   * Shuttle Bundle for the Claim Segment Applicability Criteria
   */
  private var _claimSegmentsBundle: MultiSelectBundle as readonly ClaimSegmentsBundle =
      new MultiSelectBundle(DisplayKey.get('Web.BizRules.Rule.ApplicabilityCriteria.ExposureSegment'), null) {
        override property get Selected(): TypeKey[] {
          return SelectedRuleSupplier.get().ClaimSegments*.ClaimSegment.sort()
        }

        override property set Selected(selection: TypeKey[]) {
          SelectedRuleSupplier.get().ClaimSegments*.remove()
          selection
              .map(\e -> e as ClaimSegment)
              .toSet()
              .each(\claimSegment -> addClaimSegment(claimSegment))
        }

        override property get Range(): TypeKey[] {
          var selectedLossType = LossTypesBundle.Selected as LossType
          if (selectedLossType == null) {
            return {}
          }
          return LOBUtil.getClaimSegments(selectedLossType).toTypedArray()
        }

        private function addClaimSegment(claimSegment: ClaimSegment) {
          var acClaimSegment = new AppCritClaimSegment()
          acClaimSegment.ClaimSegment = claimSegment
          SelectedRuleSupplier.get().addToClaimSegments(acClaimSegment)
        }
      }
}

