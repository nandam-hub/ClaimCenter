package edge.capabilities.claim.policy
uses edge.di.annotations.ForAllGwNodes
uses edge.capabilities.currency.dto.AmountDTO
uses edge.capabilities.claim.policy.dto.CoverageDTO

/**
 * Default implementation of coverage plugin.
 */
class DefaultCoveragePlugin implements ICoveragePlugin {

  @ForAllGwNodes
  construct() {

  }


  override function toDTO(coverage : Coverage) : CoverageDTO {
    final var res = new CoverageDTO()
    fillBaseProperties(res, coverage)
    return res
  }
  
  
  /**
   * Fills base properties on the coverage DTO.
   */
  public static function fillBaseProperties(dto : CoverageDTO, cov : Coverage) {
    dto.Name = cov.Type.DisplayName
    dto.EffectiveDate = cov.EffectiveDate
    dto.ExpirationDate = cov.ExpirationDate
    if (cov.HasDeductibleAmount){
      dto.Deductible = AmountDTO.fromCurrencyAmount(cov.DeductibleAmount)
    }
    
    if (cov.HasExposureLimit){
      dto.ExposureLimit = AmountDTO.fromCurrencyAmount(cov.ExposureLimit)
    }
    
    if (cov.HasIncidentLimit){
      dto.IncidentLimit = AmountDTO.fromCurrencyAmount(cov.IncidentLimit)
    }
  }
}
