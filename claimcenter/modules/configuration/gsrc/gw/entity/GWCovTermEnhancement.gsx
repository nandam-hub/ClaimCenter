package gw.entity

uses gw.api.locale.DisplayKey
uses gw.api.util.CurrencyUtil
uses gw.api.util.DisplayableException

uses java.text.DecimalFormat

@Export
enhancement GWCovTermEnhancement : CovTerm {
  /**
   * Returns the model type for this coverage term; this is the CovTermModelType related to this coverage term's CovTermPattern.
   *
   * @return CovTermModelType for this CovTerm
   */
  property get ModelType() : CovTermModelType {
    return getModelTypeFromPattern(this.CovTermPattern)
  }

  /**
   * Return the ModelType based on the original value of the CovTermPattern.
   * If CovTermPattern is unchanged, then this is just the ModelType.
   *
   * @return original value of ModelType before changes to CovTermPattern in the current bundle
   */
  property get OriginalModelType() : CovTermModelType {
    if (this.isFieldChanged(CovTerm#CovTermPattern)) {
      return getModelTypeFromPattern(this.getOriginalValue(CovTerm#CovTermPattern))
    } else {
      return ModelType
    }
  }

  /**
   * @return true if covterm is financial and it is either:
   * 1. new and its ModelType is deductible
   * 2. changed from deductible to non-deductible or its amount changed
   * 3. changed from deductible to non-deductible
   */
  public property get DeductibleParametersChanged() : boolean {
    if(!Financial) {
      return false
    }
    if (this.New) {
      return this.ModelType == CovTermModelType.TC_DEDUCTIBLE
    } else if (this.ModelType == CovTermModelType.TC_DEDUCTIBLE) {
      return this.OriginalModelType != CovTermModelType.TC_DEDUCTIBLE
          or this.isFieldChanged(FinancialCovTerm#FinancialAmount)
    } else {
      return this.OriginalModelType == CovTermModelType.TC_DEDUCTIBLE
    }
  }

  /**
   * @return true if cov term is financial and its amount isn't null and isn't zero
   */
  public property get AmountBiggerThanZero(): boolean {
    return this.HasAmount && !(this as FinancialCovTerm).FinancialAmount.Amount.IsZero
  }

  /**
   * @return true if cov term is financial and its amount isn't null
   */
  public property get HasAmount(): boolean {
    return this typeis FinancialCovTerm
        && this.FinancialAmount != null
        && this.FinancialAmount.Amount != null
  }

  /**
   * @return true if covterm is financial and its previous model was deductible.
   */
  public property get WasDeductible(): boolean {
    return Financial and this.OriginalModelType == CovTermModelType.TC_DEDUCTIBLE
  }

  /**
   * Returns a string representing the value of this covterm.
   * For a NumericCovTerm this is the numeric value along with its units.
   * For a FinancialCovTerm this is the the financial amount.
   * For a ClassificationCovTerm this is its description.
   * For any other type of CovTerm this returns the covterm's display name.
   *
   * @return string representation of the value of this covterm
   */
  property get Value() : String {
    try {
      if (this typeis NumericCovTerm) {
        var number = new DecimalFormat(this.NumericFormat).format(this.NumericValue)
        return this.Units == null ? number : number + " " + this.Units
      } else if (this typeis FinancialCovTerm) {
        return CurrencyUtil.renderAsCurrency(this.FinancialAmount, this.Coverage.Currency)
      } else if (this typeis ClassificationCovTerm) {
        return this.Description
      } else {
        return this.DisplayName
      }
    } catch (e : IllegalArgumentException) {
      throw new DisplayableException(DisplayKey.get("Web.Claim.Coverage.CoverageTerm.FormattingError", e.Message))
    }
  }

  property get CovTermMode() : String {
    if (this typeis NumericCovTerm) {
      return "Numeric"
    } else if (this typeis FinancialCovTerm) {
      return "Financial"
    } else if (this typeis ClassificationCovTerm) {
      return "Classification"
    }
    return "default"
  }

  /**
   * Get the numeric format for numeric coverage terms.
   * @return the numeric format that is used to format the numeric values
   */
  property get NumericFormat() : String {
    return "###,###,###.####"
  }

  /**
   * @return true if covterm is financial.
   */
  private property get Financial(): boolean {
    return this typeis FinancialCovTerm
  }

  /**
   * @return true this covTerm is deductible covTerm. Criteria for this are it is Financial and ModelType is Deductible, false otherwise.
   */
  property get Deductible(): boolean {
    return this typeis FinancialCovTerm and this.ModelType == CovTermModelType.TC_DEDUCTIBLE
  }

  private static function getModelTypeFromPattern(pattern : CovTermPattern) : CovTermModelType {
    if (pattern == null) {
      return null
    }
    var categories = pattern.Categories.where(\cat -> cat typeis CovTermModelType)
    if (categories.length > 1) {
      throw new IllegalStateException("CovTerm Pattern " + pattern + " has more than one CovTermModelType; this indicates a configuration error.")
    }
    return categories.first() as CovTermModelType
  }
}
