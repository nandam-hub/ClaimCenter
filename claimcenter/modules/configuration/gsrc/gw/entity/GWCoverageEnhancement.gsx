package gw.entity

uses com.ibm.icu.text.ListFormatter
uses gw.api.locale.DisplayKey
uses java.lang.StringBuilder
uses gw.api.util.CurrencyUtil
uses gw.config.CoverageAbstraction

@Export
enhancement GWCoverageEnhancement : Coverage {
  
  property get IsEditable() : boolean {
    return this.ClaimDeductible == null or this.ClaimDeductible.TransactionLineItems.IsEmpty
  }

  /**
   * Used to display a brief summary of the coverage details in the UI: the deductible and the exposure and incident
   * limits. Typically used in conjunction with a label that gives the coverage type
   */
  property get DetailsSummary() : String {
    var result = new ArrayList<String>()
    var deductibleCovTerms = this.CovTerms.where(\covterm -> covterm.Deductible)
        .sort(\o1, o2 -> (o1 as FinancialCovTerm).FinancialAmount.Amount.compareTo((o2 as FinancialCovTerm).FinancialAmount.Amount))

    if (deductibleCovTerms.length > 1) {
      for (cov in deductibleCovTerms) {
        result.add(DisplayKey.get("Web.BasicInfoScreen.VehiclePanelIterator.CoverageLV.PerilBasedDeductible",
            CurrencyUtil.renderAsCurrency((cov as FinancialCovTerm).FinancialAmount),
            cov.CovTermPattern.DisplayName))
      }
    } else if (deductibleCovTerms.length == 1) {
      result.add(DisplayKey.get("Web.BasicInfoScreen.VehiclePanelIterator.CoverageLV.Deductible",
          CurrencyUtil.renderAsCurrency((deductibleCovTerms.single() as FinancialCovTerm).FinancialAmount)))
    }

    if (this.HasExposureLimit and this.HasIncidentLimit) {
      result.add(DisplayKey.get("Web.BasicInfoScreen.VehiclePanelIterator.CoverageLV.ExposureAndIncidentLimit",
          CurrencyUtil.renderAsCurrency(this.ExposureLimit), CurrencyUtil.renderAsCurrency(this.IncidentLimit)))
    } else {
      var limit = this.HasExposureLimit ? this.ExposureLimit : this.IncidentLimit
      if (limit != null) {
        result.add(DisplayKey.get("Web.BasicInfoScreen.VehiclePanelIterator.CoverageLV.Limit", CurrencyUtil.renderAsCurrency(limit)))
      }
    }

    return ListFormatter.getInstance().format(result)
  }
 
 /**
  * Instantiate the correct CovTerm subtype based on parameter passed and add it to the current Coverage.
  */
  public function createAndAddNewCovTerm(CovTermType : typekey.CovTerm) : CovTerm {
    var newCovTerm : CovTerm
     switch(CovTermType) {
      case typekey.CovTerm.TC_FINANCIALCOVTERM: 
        newCovTerm = new FinancialCovTerm()
        break
      case typekey.CovTerm.TC_CLASSIFICATIONCOVTERM:
        newCovTerm = new ClassificationCovTerm()
        break        
      case typekey.CovTerm.TC_NUMERICCOVTERM:
        newCovTerm = new NumericCovTerm()
        break          
    }
    this.addToCovTerms(newCovTerm)
    return newCovTerm
  }
  
  /**
   * Tests whether or not Exposure limit is non-null and non-zero
   */
  public property get HasExposureLimit() : Boolean {
    return this.ExposureLimit != null and
      !this.ExposureLimit.Amount.IsZero
  }

  /**
   * Tests whether or not Exposure limit is non-null and non-zero
   */
  public property get HasIncidentLimit() : Boolean {
    return this.IncidentLimit != null and
      !this.IncidentLimit.Amount.IsZero
  }

  /**
   * Gets the Master coverage on which shared deductibles live
   */
  public property get Master(): Coverage {
    return CoverageAbstraction.getMasterCoverage(this)
  }
}
