package gw.config

@Export
enum CoverageSubtypeAbstraction {
  WorkersCompCoverageMedicalOnly                      (CoverageSubtype.TC_WCWORKERSCOMPMED),
  WorkersCompCoverageOtherThanMedical                 (CoverageSubtype.TC_WCWORKERSCOMPWAGES),
  WorkersCompEmployersLiability                       (CoverageSubtype.TC_WCEMPLIABCOV),
  WorkersCompFederalEmployersLiability                (CoverageSubtype.TC_WCFEDEMPLIABCOV),
  WorkersCompOtherStatesInsuranceMedicalOnly          (CoverageSubtype.TC_WCOTHERSTATESMED),
  WorkersCompOtherStatesInsuranceOtherThanMedical     (CoverageSubtype.TC_WCOTHERSTATESWAGES),
  WorkersCompStateSpecificDeductibleMedicalOnly       (CoverageSubtype.TC_WCWORKCOMPDEDUCTMED),
  WorkersCompStateSpecificDeductibleOtherThanMedical  (CoverageSubtype.TC_WCWORKCOMPDEDUCTNOTMED)

  static function forTypeKey(tk: CoverageSubtype): CoverageSubtypeAbstraction {
    return CoverageSubtypeAbstraction.AllValues.firstWhere(\elt -> elt.TypeKey == tk)
  }

  private final var _typekey: CoverageSubtype as readonly TypeKey

  private construct(typekey: CoverageSubtype) {
    _typekey = typekey
  }

  property get UIMode(): String {
    return name()
  }

  property get Description(): String {
    return TypeKey.Description
  }
}