package gw.bizrules.csv

uses gw.entity.TypeKey
uses gw.pl.persistence.core.Bundle

/**
 * Claim Center Application Criteria Factory.
 */
@Export
class AppCriteriaFactoryImpl implements AppCriteriaFactory {
  override function create(typekeys : TypeKey[], bundle: Bundle) : Object[] {
    if(typekeys typeis LossType[]) {
      return typekeys.map(\typekey -> new AppCritLossType(bundle) {:LossType = typekey})
    }

    if(typekeys typeis LossCause[]) {
      return typekeys.map(\typekey -> new AppCritLossCause(bundle) {:LossCause = typekey})
    }

    if(typekeys typeis ExposureType[]) {
      return typekeys.map(\typekey -> new AppCritExposureType(bundle) {:ExposureType = typekey})
    }

    if(typekeys typeis PolicyType[]) {
      return typekeys.map(\typekey -> new AppCritPolicyType(bundle) {:PolicyType = typekey})
    }

    if(typekeys typeis Jurisdiction[]) {
      return typekeys.map(\typekey -> new AppCritJurisdiction(bundle) {:Jurisdiction = typekey})
    }

    if(typekeys typeis ClaimSegment[]) {
      return typekeys.map(\typekey -> new AppCritClaimSegment(bundle) {:ClaimSegment = typekey})
    }

    throw new IllegalArgumentException("Typelist ${typekeys.Class} is not supported")
  }
}