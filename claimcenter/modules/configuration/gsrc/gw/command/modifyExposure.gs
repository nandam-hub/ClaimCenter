package gw.command

uses gw.api.databuilder.FinancialCovTermBuilder
uses gw.api.financials.CurrencyAmount
uses gw.api.util.DisplayableException
uses gw.transaction.Transaction

uses java.math.BigDecimal

@Export
class modifyExposure extends CCBaseCommand {

  construct() { }

  @Argument<BigDecimal>("Amount", 503bd)
  function setDeductible() {
    var coverage = CurrentExposure.Coverage

    if (coverage == null) {
      throw new DisplayableException("This exposure is not linked to a policy coverage!")
    }

    var deductibleCovTerm = coverage.CovTerms.firstWhere(\ term -> term.CovTermPattern?.hasCategory(CovTermModelType.TC_DEDUCTIBLE)) as FinancialCovTerm

    var financialAmount = new CurrencyAmount(getArgumentAsBigDecimal("Amount"), coverage.Currency)

    if (deductibleCovTerm == null) {
      deductibleCovTerm = new FinancialCovTermBuilder()
          .withDeductiblePatternFor(coverage)
          .withFinancialAmount(financialAmount)
          .createAndCommit()
    }
    else {
      Transaction.runWithNewBundle(\ bundle -> {
        bundle.add(deductibleCovTerm).FinancialAmount = financialAmount
      })
    }
  }

}