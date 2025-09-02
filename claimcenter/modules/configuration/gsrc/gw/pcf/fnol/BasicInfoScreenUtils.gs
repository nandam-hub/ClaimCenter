package gw.pcf.fnol

@Export
class BasicInfoScreenUtils {
  private var _claim: Claim
  private var _mainContactSamePerson: boolean
  
  public construct(claim: Claim) {
    _claim = claim
    _mainContactSamePerson = (_claim.maincontact == null and _claim.MainContactType == null) ||
        (_claim.maincontact == _claim.reporter and _claim.MainContactType == _claim.ReportedByType)
  }

  function setReportedByToInsured() {
    if (_claim.reporter == _claim.Insured) {
      _claim.ReportedByType = PersonRelationType.TC_SELF
    } else {
      _claim.ReportedByType = null;
    }

    if (_mainContactSamePerson) {
      fillMainContactFromReportedBy()
    }
  }

  function fillMainContactFromReportedByForSamePerson() {
    if (_mainContactSamePerson) {
      fillMainContactFromReportedBy()
    }
  }

  function fillMainContactFromReportedByForSamePersonOrResetToNull() {
    if (_mainContactSamePerson) {
      fillMainContactFromReportedBy()
    }
    else {
      _claim.maincontact = null;
      _claim.MainContactType = null;
    }
  }

  private function fillMainContactFromReportedBy() {
    _claim.maincontact = _claim.reporter as Person;
    _claim.MainContactType = _claim.ReportedByType;
  }

  property get MainContactSamePerson(): boolean {
    return _mainContactSamePerson
  }

  property set MainContactSamePerson(value: boolean) {
    _mainContactSamePerson = value
  }
}