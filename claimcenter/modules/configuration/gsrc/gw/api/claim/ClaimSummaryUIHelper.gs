package gw.api.claim

uses gw.api.locale.DisplayKey

@Export
class ClaimSummaryUIHelper {

  var _claim : Claim as readonly Claim

  construct (claim: Claim) {
    _claim = claim
  }

  property get DaysOpenPercentage() : java.lang.Double {
    var limit = _claim.DaysOpenClaimMetric.Limit
    var daysOpen = _claim.DaysOpenClaimMetric.Value as java.lang.Integer
    var result : java.lang.Double = null
    if (limit != null) {
      if (limit.RedValue != null) {
        result = calculatePercentageValue(daysOpen, limit.RedValue)
      } else if (limit.YellowValue != null) {
        result = calculatePercentageValue(daysOpen, limit.YellowValue )
      } else if (limit.TargetValue != null) {
        result = calculatePercentageValue(daysOpen, limit.TargetValue )
      }
    }
    return result
  }

  property get LowThreshold() : java.lang.Double {
    var limit = _claim.DaysOpenClaimMetric.Limit
    var threshold : java.lang.Double = null
    if (limit != null) {
      if (limit.YellowValue != null and limit.RedValue != null) {
        threshold = (new java.math.BigDecimal(limit.YellowValue as java.lang.Integer)).divide(new java.math.BigDecimal(limit.RedValue as java.lang.Integer), 2, gw.api.util.CurrencyUtil.getRoundingMode()).multiply( 100 ).doubleValue()
      } else {
        threshold = MaxPercentage
      }
    }
    return threshold
  }

  property get HighThreshold() : java.lang.Double {
    var limit = _claim.DaysOpenClaimMetric.Limit
    var threshold : java.lang.Double = null
    if (limit != null) {
      if (limit.RedValue != null or onlyTargetValueExists(limit)) {
        //when both yellow and red value is null but target is not null, set high threshold to 100
        //this is done so that the progress bar can show green color
        threshold = MaxPercentage
      }
    }
    return threshold
  }

  property get OpenStatus() : String {
    var status : String = null
    var limit = _claim.DaysOpenClaimMetric.Limit
    var value = _claim.DaysOpenClaimMetric.Value
    if (value == (1 as java.lang.Comparable<java.lang.Object>)) {
      if (limit.TargetValue != null and limit.TargetValue != (0 as java.lang.Comparable<java.lang.Object>)) {
        status = DisplayKey.get("Web.ClaimSummary.Headline.Basics.ClaimOpenStringSingularWithTarget", value, limit.TargetValue)
      } else {
        status = DisplayKey.get("Web.ClaimSummary.Headline.Basics.ClaimOpenStringSingular", value )
      }
    } else {
      if (limit.TargetValue != null and limit.TargetValue != (0 as java.lang.Comparable<java.lang.Object>)) {
        status = DisplayKey.get("Web.ClaimSummary.Headline.Basics.ClaimOpenStringPluralWithTarget", value, limit.TargetValue )
      } else {
        status = DisplayKey.get("Web.ClaimSummary.Headline.Basics.ClaimOpenStringPlural", value )
      }
    }
    return status
  }

  function showBarInput() : boolean {
    var limit = _claim.DaysOpenClaimMetric.Limit
    if (limit != null) {
      //if any of the red/yellow/target value is not null and not 0, show the progressbar
      if ((limit.RedValue != null and limit.RedValue != (0 as java.lang.Comparable<java.lang.Object>))
          or (limit.TargetValue != null and limit.TargetValue != (0 as java.lang.Comparable<java.lang.Object>))
          or (limit.YellowValue != null and limit.YellowValue != (0 as java.lang.Comparable<java.lang.Object>))) {
        return true
      }
    }
    return false
  }

  function getClaimClosedText() : String {
    var text : String = null
    var closeDate = _claim.CloseDate == null ? DisplayKey.get("Web.NA") : _claim.CloseDate.format(gw.api.util.LocaleUtil.getCurrentLocale().DateFormat.Short)
    if (_claim.DaysOpenClaimMetric.Value == (1 as java.lang.Comparable<java.lang.Object>)) {
      text = DisplayKey.get("Web.ClaimSummary.Headline.Basics.ClaimClosedStringSingular", closeDate , _claim.DaysOpenClaimMetric.Value)
    } else {
      text = DisplayKey.get("Web.ClaimSummary.Headline.Basics.ClaimClosedStringPlural", closeDate , _claim.DaysOpenClaimMetric.Value)
    }
    return text
  }

  private function calculatePercentageValue(value : java.lang.Integer, threshold : java.lang.Comparable) : java.lang.Double {
    var result : java.lang.Double = null
    if (value >= threshold) {
      result = MaxPercentage
    } else {
      result = (new java.math.BigDecimal(value)).divide(new java.math.BigDecimal(threshold as java.lang.Integer), 2, gw.api.util.CurrencyUtil.getRoundingMode() ).multiply( 100 ).doubleValue()
    }
    return result
  }

  function onlyTargetValueExists(limit : gw.api.metric.MetricLimitMethods ) : boolean {
    return limit.YellowValue == null and limit.RedValue == null and limit.TargetValue != null
  }

  function noYellowValueExists(limit : gw.api.metric.MetricLimitMethods) : boolean {
    return limit.YellowValue == null
  }

  property get MaxPercentage() : java.lang.Double {
    return 100
  }

}