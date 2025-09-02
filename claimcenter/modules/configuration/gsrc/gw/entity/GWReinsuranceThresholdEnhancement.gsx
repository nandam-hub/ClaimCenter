package gw.entity
uses gw.api.locale.DisplayKey
uses gw.api.util.LocationUtil
uses java.util.List

@Export
enhancement GWReinsuranceThresholdEnhancement : entity.ReinsuranceThreshold {

  function findOverlaps(others : List<entity.ReinsuranceThreshold>) : boolean {
    var foundOverlap = false
    for (other in others) {
      if (not((this.StartDate==null and this.EndDate == null and other.StartDate!=null and other.EndDate!=null) or
          (other.StartDate==null and other.EndDate == null and this.StartDate!=null and this.EndDate!=null))) {
        if (this.overlaps(other)) {
          LocationUtil.addRequestScopedErrorMessage(
              DisplayKey.get("Web.Admin.ReinsuranceThresholds.OverlappingThresholds", this, other))
          foundOverlap = true
        }
      }
    }
    return foundOverlap
  }
}  