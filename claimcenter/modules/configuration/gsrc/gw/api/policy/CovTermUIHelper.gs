package gw.api.policy

@Export
class CovTermUIHelper {

  var _coverageTerm : CovTerm

  construct(covTerm: CovTerm) {
    _coverageTerm = covTerm
  }


  /**
   * Tests whether or not this covterm should be read-only
   *
   * If this is a percent-based deductible covterm,
   * which has been translated into another money-based covterm,
   * return true since this is a copy CC pulled over for informational purpose only.
   */
  property get IsReadOnly(): Boolean {
    return (_coverageTerm.ModelType == CovTermModelType.TC_DEDUCTIBLE and
        _coverageTerm.Coverage.CovTerms.hasMatch(\covTerm -> covTerm typeis FinancialCovTerm and covTerm != _coverageTerm and covTerm.CovTermPattern == _coverageTerm.CovTermPattern))
  }

  property get IsEditable(): Boolean {
    return !_coverageTerm.Coverage.Policy.Verified and !this.IsReadOnly
  }

}