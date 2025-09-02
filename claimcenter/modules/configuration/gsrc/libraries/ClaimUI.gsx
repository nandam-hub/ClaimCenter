package libraries

uses gw.config.LOBAbstraction
uses org.slf4j.Logger
uses org.slf4j.LoggerFactory

@Export
enhancement ClaimUI: entity.Claim {
  function init() {
    if (!this.areInitialValuesSet()) {
      this.setInitialValues()
    }
  }

  function setInitialValues() {
    setLOBCode()
    setWorkerCompData()
    setReportData()
  }

  function areInitialValuesSet(): boolean {
    return this.LOBCode != null
  }

  function cancelTrips(checkedTripRU: entity.TripRU[]) {
    for (eachTripRU in checkedTripRU) {
      var newTripIncident = new TripIncident()
      newTripIncident.TripRU = eachTripRU
      this.addToIncidents(newTripIncident)
    }
  }

  function undoTripCancellation(checkedTripRU: entity.TripRU[]) {
    for (eachTripRU in checkedTripRU) {
      for (eachTripIncident in this.TripIncidentsOnly) {
        if (eachTripIncident.TripRU == eachTripRU) {
          this.removeFromIncidents(eachTripIncident)
        }
      }
    }
  }

  private function setReportData() {
    if (this.ReportedDate == null) {
      this.ReportedDate = gw.api.util.DateUtil.currentDate()
    }
    this.SIUStatus = TC_NO_REFERRAL
    this.IncidentReport = false
  }

  private function setWorkerCompData() {
    if (LOBAbstraction.ForClaim.ForLossType.isWorkComp(this)) {
      if (this.LocationCode != null and (this.AddressOwner.Address == null or this.AddressOwner.Address.New)) {
        this.AddressOwner.Address = this.LocationCode.Address
      }
      this.ClaimWorkComp = new ClaimWorkComp(this)
      var claimInjuryIncident = this.ensureClaimInjuryIncident()
      claimInjuryIncident.GeneralInjuryType = typekey.InjuryType.TC_SPECIFIC
      claimInjuryIncident.DetailedInjuryType = typekey.DetailedInjuryType.TC_59
      if (claimInjuryIncident.BodyParts.length == 0) {
        var newBodyPart = claimInjuryIncident.newBodyPart()
        newBodyPart.PrimaryBodyPart = typekey.BodyPartType.TC_MULTIPLE
        newBodyPart.DetailedBodyPart = typekey.DetailedBodyPartType.TC_65
        claimInjuryIncident.addToBodyParts(newBodyPart)
      }
      this.EmploymentData = this.newEmploymentData()
    }
  }

  private function setLOBCode() {
    var lobCodes = LOBCode.AllTypeKeys
        .where(\lobCode -> lobCode.hasCategory(this.LossType) && lobCode.hasCategory(this.Policy.PolicyType))

    if(lobCodes.size() == 0) {
      Logger.error("There are no LOB codes associated with LossType = ${this.LossType} and PolicyType = ${this.Policy.PolicyType}");
    }
    else if(lobCodes.size() == 1) {
      this.LOBCode = lobCodes.single()
    }
    else {
      Logger.warn("There are more then one LOB codes associated with " +
                  "LossType = ${this.LossType} and PolicyType = ${this.Policy.PolicyType}, taking the first = ${lobCodes.first()}");
      this.LOBCode = lobCodes.first()
    }
  }

  private property get Logger(): Logger {
    return LoggerFactory.getLogger(ClaimUI);
  }
}