package gw.api.financials

@Export
class CoverageDeductibleMethodsImpl implements CoverageDeductibleMethods {

  var _coverage: Coverage

  construct(coverage: Coverage) {
    this._coverage = coverage
  }

  override property get ClaimDeductible(): Deductible {
    return _coverage.Deductibles.length == 1
      ?_coverage.Deductibles.single()
      :_coverage.Master.ClaimDeductible
  }
}