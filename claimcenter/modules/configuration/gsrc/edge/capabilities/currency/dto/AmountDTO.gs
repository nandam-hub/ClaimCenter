package edge.capabilities.currency.dto

uses edge.jsonmapper.JsonProperty
uses edge.aspects.validation.annotations.Currency
uses java.math.BigDecimal
uses gw.api.util.CurrencyUtil

/**
* This class uses the 'old' method of mapping DTOs in its constructor.<br></br>
* This is because there are multiple potential inputs to this DTO, and not all are present on all platforms.
* (see CurrencyAmount vs MonetaryAmount in Emerald for example).
 */
class AmountDTO{

  @JsonProperty
  @Currency
  var _amount : BigDecimal as Amount

  @JsonProperty
  var _currency : typekey.Currency as Currency

  construct(){
    this.Amount = 0
    this.Currency = CurrencyUtil.getDefaultCurrency()
  }
}
