package gw.pcf

@Export
class RiskUnitUtils {
  private construct() {}

  public static function getCoverageForm(riskUnit: Dynamic): String {
    return (riskUnit.EntityType == typekey.RiskUnit.TC_PROPERTYRU.Code) ? riskUnit.CoverageForm.Name : null
  }

  public static function hasCoverageForm(riskUnit: Dynamic): boolean {
    return getCoverageForm(riskUnit) != null
  }

  public static function getCoveragePartTypes(riskUnit: Dynamic): String {
    var names = new ArrayList<String>()
    for(type in riskUnit.CoverageParts) {
      names.add(type.CoveragePartType.Name)
    }
    return names.sort().join(", ")
  }

  public static function hasCoveragePartTypes(riskUnit: Dynamic): boolean {
    return !getCoveragePartTypes(riskUnit).isEmpty()
  }

  public static function getCoverageForm(riskUnit: entity.RiskUnit): String {
    return (riskUnit typeis PropertyRU) ? (riskUnit as PropertyRU).CoverageForm.DisplayName : null
  }

  public static function hasCoverageForm(riskUnit: entity.RiskUnit): boolean {
    return getCoverageForm(riskUnit) != null
  }

  public static function getCoveragePartTypes(riskUnit: entity.RiskUnit): String {
    return riskUnit.CoverageParts.map(\elt -> elt.CoveragePartType.DisplayName).sort().join(", ")
  }

  public static function hasCoveragePartTypes(riskUnit: entity.RiskUnit): boolean {
    return !getCoveragePartTypes(riskUnit).isEmpty()
  }

  public static function isDeductiblePresent(riskUnit: dynamic.Dynamic): boolean {
    for(coverage in riskUnit.Coverages) {
      if(coverage.Deductible != null && coverage.Deductible.Amount != null) {
        return true
      }
    }
    return false
  }

  public static function isDeductiblePresent(riskUnit: entity.RiskUnit): boolean {
    for(coverage in riskUnit.Coverages) {
      if(coverage.Deductible != null && coverage.Deductible.Amount != null) {
        return true
      }
    }
    return false
  }
}