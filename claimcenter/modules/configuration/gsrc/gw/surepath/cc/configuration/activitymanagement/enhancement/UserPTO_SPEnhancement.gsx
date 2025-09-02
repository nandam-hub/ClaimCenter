package gw.surepath.cc.configuration.activitymanagement.enhancement

uses gw.api.locale.DisplayKey
uses gw.surepath.cc.configuration.activitymanagement.api.bcactivityapi.bcactivityapi.faults.DisplayableException
uses gw.surepath.suite.configuration.annotation.IncludeInDocumentation

enhancement UserPTO_SPEnhancement : UserPTO_SP {

  /**
   * Validate that the start date does not fall before the end date
   */
  @IncludeInDocumentation
  function validateDateRange() {
    if (this.BeginDate != null and this.EndDate != null) {
      //date range for this record must be valid, cannot have start date after end date
      if (this.BeginDate.compareTo(this.EndDate) > 0) {
        this.rejectField(entity.UserPTO_SP#BeginDate.PropertyInfo.Name, TC_LOADSAVE,
            DisplayKey.get("SP.ActivityManagement.Validation.UserPTORecordInvalidDateRange"), null, null)
      }
    }
  }

  /**
   * Validate this record does not overlap with any others for the same user
   */
  @IncludeInDocumentation
  function validateDateRangeAganistRelatedRecords() {
    if (this.BeginDate != null and this.EndDate != null) {
      //date range for this record must not overlap with any related records
      var thisRecordsDates = new ArrayList<Date>()
      var dateWalked = this.BeginDate
      thisRecordsDates.add(dateWalked)
      while (dateWalked.before(this.EndDate)) {
        dateWalked = dateWalked.addDays(1)
        thisRecordsDates.add(dateWalked)
      }
      var relatedRecords = this.User.UserPTO_SP.where(\elt -> elt != this)
      for (eachRelatedRecord in relatedRecords) {
        var relatedDateWalked = eachRelatedRecord.BeginDate
        if (thisRecordsDates.hasMatch(\elt1 -> elt1 == relatedDateWalked)) {
          this.rejectField(entity.UserPTO_SP#BeginDate.PropertyInfo.Name, TC_LOADSAVE,
              DisplayKey.get("SP.ActivityManagement.Validation.UserPTORecordOverlappingRecords"), null, null)
        }
        while (relatedDateWalked.before(eachRelatedRecord.EndDate)) {
          relatedDateWalked = relatedDateWalked.addDays(1)
          if (thisRecordsDates.hasMatch(\elt1 -> elt1 == relatedDateWalked)) {
            this.rejectField(entity.UserPTO_SP#BeginDate.PropertyInfo.Name, TC_LOADSAVE,
                DisplayKey.get("SP.ActivityManagement.Validation.UserPTORecordOverlappingRecords"), null, null)
          }
        }
      }
    }
  }

  /**
   * Validate for new records that the record is marked as active
   */
  @IncludeInDocumentation
  function validateActiveStatusForNewRecords() {
    if (this.New and not this.Active) {
      this.rejectField(entity.UserPTO_SP#Active.PropertyInfo.Name, TC_LOADSAVE,
          DisplayKey.get("SP.ActivityManagement.Validation.UserPTONewRecordNotActive"), null, null)
    }
  }

  /**
   * Validate for new records that the batch process date is null
   */
  @IncludeInDocumentation
  function validateBatchProcessDateForNewRecords() {
    if (this.New and this.BatchProcessDate != null) {
      this.rejectField(entity.UserPTO_SP#BatchProcessDate.PropertyInfo.Name, TC_LOADSAVE,
          DisplayKey.get("SP.ActivityManagement.Validation.UserPTONewRecordBatchProcessDateNotNull"), null, null)
    }
  }

}
