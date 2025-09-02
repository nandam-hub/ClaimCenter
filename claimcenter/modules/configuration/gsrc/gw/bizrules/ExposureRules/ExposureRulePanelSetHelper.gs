package gw.bizrules.ExposureRules

uses gw.api.locale.DisplayKey
uses gw.api.util.LOBUtil
uses gw.bizrules.CCRulePanelSetHelper
uses gw.bizrules.ruleaction.createexposure.config.ExposureCommandParameterConfig
uses gw.entity.TypeKey
uses pcf.api.Location
uses typekey.Incident

/**
 * Helper class for the Exposure Rule Panel Set pcf
 */
@Export
class ExposureRulePanelSetHelper extends CCRulePanelSetHelper<ExposureRule> {
  private static var _exposureRuleUtil = new ExposureRuleUtil()

  construct(rule: ExposureRule, location: Location) {
    super(rule, location)
  }

  /**
   * Shuttle Bundle for the Loss Cause Applicability Criteria
   *
   * @return
   */
  private var _lossCausesBundle : MultiSelectBundle as readonly LossCausesBundle = new MultiSelectBundle(DisplayKey.get('Web.BizRules.Rule.ApplicabilityCriteria.LossCause'), null) {
    override property get Selected(): TypeKey[] {
      return SelectedRuleSupplier.get().LossCauses*.LossCause.sort()
    }

    override property set Selected(selection: TypeKey[]) {
      SelectedRuleSupplier.get().LossCauses*.remove()
      selection
          .map(\e -> e as LossCause)
          .toSet()
          .each(\lossCause -> addLossCause(lossCause))
    }

    override property get Range(): TypeKey[] {
      var possibleLossTypes = LossTypesBundle.Range
      return possibleLossTypes.flatMap(\lossType -> LOBUtil.getLossCauses(lossType as LossType))
    }

    private function addLossCause(lossCause: LossCause) {
      var acLossCause = new AppCritLossCause()
      acLossCause.LossCause = lossCause
      SelectedRuleSupplier.get().addToLossCauses(acLossCause)
    }
  }

  /**
   * RangeInput Bundle for the Incident Type Applicability Criteria
   *
   * @return
   */
  property get IncidentTypesBundle(): SingleSelectBundle {
    return new SingleSelectBundle(DisplayKey.get('Web.BizRules.Rule.ApplicabilityCriteria.IncidentType'), null) {
      override property get Selected(): TypeKey {
        return SelectedRuleSupplier.get().IncidentTypes*.IncidentType.first()
      }

      override property set Selected(selection: TypeKey) {
        SelectedRuleSupplier.get().IncidentTypes*.remove()
        if (selection != null) {
          addIncidentType(selection as Incident)
        }
      }

      override property get Range(): TypeKey[] {
        var selectedPolicyType = PolicyTypesBundle.Selected as PolicyType
        if (selectedPolicyType == null) {
          return {}
        }

        var incidentsForPolicy = _exposureRuleUtil.getApplicableIncidentsForPolicy(selectedPolicyType)
        return incidentsForPolicy.toTypedArray()
      }

      private function addIncidentType(incidentType: Incident) {
        var acIncidentType = new AppCritIncidentType()
        acIncidentType.IncidentType = incidentType
        SelectedRuleSupplier.get().addToIncidentTypes(acIncidentType)
      }
    }
  }

  /**
   * RangeInput Bundle for the Loss Party Type Applicability Criteria
   *
   * @return
   */
  property get LossPartyTypesBundle(): SingleSelectBundle {
    return new SingleSelectBundle(DisplayKey.get('Web.BizRules.Rule.ApplicabilityCriteria.LossPartyType'),
        LossPartyType.getTypeKeys(false).toTypedArray()) {
      override property get Selected(): TypeKey {
        return SelectedRuleSupplier.get().LossPartyTypes*.LossPartyType.first()
      }

      override property set Selected(selection: TypeKey) {
        SelectedRuleSupplier.get().LossPartyTypes*.remove()
        if (selection != null) {
          addLossPartyType(selection as LossPartyType)
        }
      }

      private function addLossPartyType(lossPartyType: LossPartyType) {
        var acLossPartyType = new AppCritLossPartyType()
        acLossPartyType.LossPartyType = lossPartyType
        SelectedRuleSupplier.get().addToLossPartyTypes(acLossPartyType)
      }
    }
  }

  property get LossTypesBundle(): SingleSelectBundle {
    return new SingleSelectBundle(DisplayKey.get('Web.BizRules.Rule.ApplicabilityCriteria.LossType'), null) {
      override property get Selected(): TypeKey {
        return SelectedRuleSupplier.get().LossTypes*.LossType.first()
      }

      override property set Selected(selection: TypeKey) {
        SelectedRuleSupplier.get().LossTypes*.remove()
        if (selection != null) {
          addLossType(selection as LossType)
        }
      }

      override property get Range(): TypeKey[] {
        var selectedPolicyType = PolicyTypesBundle.Selected as PolicyType
        if (selectedPolicyType == null) {
          return {}
        }
        return LOBUtil.getLossTypes(selectedPolicyType).toTypedArray()
      }

      private function addLossType(lossType: LossType) {
        var acLossType = new AppCritLossType()
        acLossType.LossType = lossType
        SelectedRuleSupplier.get().addToLossTypes(acLossType)
      }
    }
  }

  /**
   * RangeInput Bundle for the Policy Type Applicability Criteria
   */
  property get PolicyTypesBundle(): SingleSelectBundle {
    return new SingleSelectBundle(DisplayKey.get('Web.BizRules.Rule.ApplicabilityCriteria.PolicyType'), null) {
      override property get Selected(): TypeKey {
        return SelectedRuleSupplier.get().PolicyTypes*.PolicyType.first()
      }

      override property set Selected(selection: TypeKey) {
        SelectedRuleSupplier.get().PolicyTypes*.remove()
        addPolicyType(selection as PolicyType)

        var currentSelectedLossType = LossTypesBundle.Selected
        if (currentSelectedLossType != null and not LossTypesBundle.Range.contains(currentSelectedLossType)) {
          LossTypesBundle.Selected = null
        }

        var currentSelectedLossCauses = LossCausesBundle.Selected
        var newValidLossCauseRange = LossCausesBundle.Range
        if (not currentSelectedLossCauses.allMatch(\lossCause -> newValidLossCauseRange.contains(lossCause))) {
          LossCausesBundle.SelectorState = true
        }

        var currentSelectedIncidentType = IncidentTypesBundle.Selected
        if (currentSelectedIncidentType != null and not IncidentTypesBundle.Range.contains(currentSelectedIncidentType)) {
          IncidentTypesBundle.Selected = null
        }

        SelectedRuleSupplier.get().OrderedRuleCommandDefinitions.each(\def -> {
          def.RuleCommandParameters.each(\param -> {
            if (param.ParameterName == ExposureCommandParameterConfig.INSTANCE.COVERAGE_TYPE.Name
                or param.ParameterName == ExposureCommandParameterConfig.INSTANCE.COVERAGE_SUBTYPE.Name) {
              (param.Expression as TypeKeyExpressionFragment).TypeKeyValue = null
            }
          })
        })
      }

      override property get Range(): TypeKey[] {
        return _exposureRuleUtil.ApplicablePolicyTypes.toTypedArray()
      }

      private function addPolicyType(policyType: PolicyType) {
        var acPolicyType = new AppCritPolicyType()
        acPolicyType.PolicyType = policyType
        SelectedRuleSupplier.get().addToPolicyTypes(acPolicyType)
      }
    }
  }

  /**
   * Shuttle Bundle for the Jurisdiction Applicability Criteria
   */
  property get JurisdictionsBundle(): MultiSelectBundle {
    return new MultiSelectBundle(DisplayKey.get('Web.BizRules.Rule.ApplicabilityCriteria.ClaimJurisdiction'),
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
}
