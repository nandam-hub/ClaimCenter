package gw.api.exposure

/**
 * UI helper to define the left navigation icons for the Exposure types
 */
@Export
class ExposureMenuListUIHelper {

  function getIconForExposureType(exp: Exposure) : String {

    switch (exp.ExposureType) {

      case ExposureType.TC_WCINJURYDAMAGE:    return "medical_details"
      case ExposureType.TC_LOSTWAGES:         return "indemnity"
      case ExposureType.TC_EMPLOYERLIABILITY: return "employer_liability"
      default:                                return ""

    }

  }

}