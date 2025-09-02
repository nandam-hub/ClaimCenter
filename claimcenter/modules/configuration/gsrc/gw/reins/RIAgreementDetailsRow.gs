package gw.reins
uses java.lang.Boolean
uses entity.RIAgreement
uses typekey.CostType
uses typekey.CostCategory
uses entity.Exposure
uses entity.ReserveLine

uses java.util.HashSet
uses java.util.ArrayList

@Export
class RIAgreementDetailsRow {

  private var _subRows = new HashSet<RIAgreementDetailsRow>()
  private var _exposure : Exposure as readonly Exposure
  private var _costType : CostType as readonly CostType
  private var _costCategory : CostCategory as readonly CostCategory
  
  private construct(exp : Exposure) {
    _exposure = exp
  }

  private construct(exp : Exposure, aCostType : CostType) {
    _exposure = exp
    _costType = aCostType
  }
  
  private construct(exp : Exposure, aCostType : CostType, aCostCategory : CostCategory) {
    _exposure = exp
    _costType = aCostType
    _costCategory = aCostCategory
  }

  public static function createRows(agreement : RIAgreement) : RIAgreementDetailsRow[] {
    var result = new ArrayList<RIAgreementDetailsRow>()
    for (exp in agreement.RIAgreementGroup.Exposures) {
      if (shouldCreateRowFor(exp)) {
        var row = new RIAgreementDetailsRow(exp)
        row.addCostTypeRows()
        result.add(row)
      }
    }
    return result.toArray(new RIAgreementDetailsRow[0]);
  }
  
  private static function shouldCreateRowFor( exp : Exposure) : Boolean {
    return exp != null
          and (exp.ReserveLines.HasElements
            or exp.RICodings.HasElements)
  }
  
  public property get Exposure() : Exposure {
    return _exposure
  }
  
  public property get CostType() : CostType {
    return _costType
  }
  
  public property get CostCategory() : CostCategory {
    return _costCategory
  }
  
  public property get NextLevelRows() : RIAgreementDetailsRow[] {
    return _subRows.toArray(new RIAgreementDetailsRow[0])
  }
  
  private function addCostTypeRows() {
    for (reserveLine in _exposure.ReserveLines) {
      ensureCostTypeRowFor(reserveLine)
    }
  }
  
  private function ensureCostTypeRowFor(reserveLine : ReserveLine) {
    var aCostType = reserveLine.CostType
    var row = getCostTypeSubRow(aCostType)
    _subRows.add(row)
    row.ensureCostCategoryRowFor(reserveLine)
  }
  
  private function getCostTypeSubRow(aCostType : CostType) : RIAgreementDetailsRow {
    var result = new RIAgreementDetailsRow(Exposure, aCostType)
    for (row in _subRows) {
       if (row.CostType.equals(aCostType)) {
         result = row
       }
    }
    return result
  }
  
  private function ensureCostCategoryRowFor(reserveLine : ReserveLine) {
    var aCostCategory = reserveLine.CostCategory
    var row = getCostCategorySubRow(aCostCategory)
    _subRows.add(row)
  }

  private function getCostCategorySubRow(aCostCategory : CostCategory) : RIAgreementDetailsRow {
    var result = new RIAgreementDetailsRow(Exposure, CostType, aCostCategory)
    for (row in _subRows) {
       if (row.CostCategory.equals(aCostCategory)) {
         result = row
       }
    }
    return result
  }
}
