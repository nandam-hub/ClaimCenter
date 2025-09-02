package gw.surepath.cc.configuration.timeline.creation.generators

uses gw.api.database.IQueryBeanResult
uses gw.api.database.Queries
uses gw.api.database.Relop
uses gw.api.locale.DisplayKey
uses gw.api.util.DateUtil
uses gw.pl.persistence.core.Bundle
uses gw.surepath.suite.configuration.annotation.IncludeInDocumentation

uses java.util.ArrayList
uses java.util.Date

/**
 * Generate timeline entries for recoveries.
 */
@IncludeInDocumentation
class RecoveryTimelineEntryGenerator implements TimelineEntryGenerator {

  /**
   * Takes in a claim CLAIM and date DATE and pulls Recoveries from the database
   * to generate Timeline entries relevant to CLAIM. If date is not null, the
   * Recoveries pulled from the DB have a CreateTime before date. For a Recovery
   * we can have creation, void, transfer, and recode entries.
   * @param claim
   * @param date
   * @return
   */
  @IncludeInDocumentation
  public function generateEntries(claim: Claim, date: Date): List<TimelineEntry_SP> {
    var retEntries = new ArrayList<TimelineEntry_SP>()
    var recoveries : IQueryBeanResult<Recovery> = null
    var bundle = claim.Bundle
    if (date == null) {
      recoveries = Queries.createQuery<Recovery>(Recovery)
          .compare(Recovery#Claim, Relop.Equals, claim)
          .select()
    } else {
      recoveries = Queries.createQuery<Recovery>(Recovery)
          .compare(Recovery#Claim, Relop.Equals, claim)
          .compare(Recovery#CreateTime, Relop.LessThan, date)
          .select()
    }
    for (recovery in recoveries) {
      var createTime = recovery.CreateTime
      if ((date == null) || (createTime < date)) {
        var recoveryBeingOffset = recovery.OnsetOriginalRecovery_SP
        if ((recoveryBeingOffset != null) && (recoveryBeingOffset.Status == TransactionStatus.TC_TRANSFERRED)) {
          retEntries.add(generateTransferEntry(recovery, bundle, createTime, "Onset"))
        } else if (recoveryBeingOffset == null && !recovery.isOffsetRecovery()) {
          retEntries.add(generateCreationOrVoidEntry(recovery, bundle, createTime, "Created"))
        }
      }
      var transactionSet = recovery.TransactionSet
      var offSet = transactionSet.Transactions
          .firstWhere(\t -> ((t typeis Recovery) && (t.isOffsetRecovery()))) as Recovery
      if (recovery.TransactionSet.Approved && (offSet != null)) {
        var offSetDate = offSet.CreateTime
        if ((date == null) || (offSetDate < date)) {
          var status = recovery.Status
          if (status == TransactionStatus.TC_TRANSFERRED) {
            retEntries.add(generateTransferEntry(recovery, bundle, offSetDate, "Offset"))
          }
          if (status == TransactionStatus.TC_VOIDED) {
            retEntries.add(generateCreationOrVoidEntry(recovery, bundle, offSetDate, "Voided"))
          }
          if (status == TransactionStatus.TC_RECODED) {
            retEntries.add(generateRecodeEntry(recovery, bundle, offSetDate))

          }
        }
      }
    }
    return retEntries
  }

  /**
   * This method looks in the bundle BUNDLE and looks at all the Recoveries relevant
   * to claim CLAIM. Using the Recoveries, this method creates creation, void, transfer,
   * and recode entries.
   * @param bundle
   * @param claim
   * @return
   */
  @IncludeInDocumentation
  public function generateEntries(bundle : Bundle, claim : Claim) : List<TimelineEntry_SP> {
    var retEntries = new ArrayList<TimelineEntry_SP>()
    var beans = bundle.InsertedAndUpdatedBeans
    for (bean in beans) {
      if ((bean typeis Recovery) && (bean.Claim == claim)) {
        var recovery = bean as Recovery
        if (recovery.New) {
          var recoveryBeingOffset = recovery.OnsetOriginalRecovery_SP
          if ((recoveryBeingOffset != null) && (recoveryBeingOffset.Status == TransactionStatus.TC_TRANSFERRED)) {
            retEntries.add(generateTransferEntry(recovery, bundle, DateUtil.currentDate(), "Onset"))
          } else if (recoveryBeingOffset == null && !recovery.isOffsetRecovery()) {
            retEntries.add(generateCreationOrVoidEntry(recovery, bundle, DateUtil.currentDate(), "Created"))
          }
        }
        if (recovery.TransactionSet.Approved) {
          var offSet = recovery.TransactionSet.Transactions
              .firstWhere(\t -> ((t typeis Recovery) && (t.isOffsetRecovery()))) as Recovery
          if (recovery.isFieldChanged(Recovery#Status) && (offSet != null)) {
            var status = recovery.Status
            var offSetDate = offSet.CreateTime
            if (status == TransactionStatus.TC_TRANSFERRED) {
              retEntries.add(generateTransferEntry(recovery, bundle, offSetDate, "Offset"))
            }
            if (status == TransactionStatus.TC_VOIDED) {
              retEntries.add(generateCreationOrVoidEntry(recovery, bundle, offSetDate, "Voided"))
            }
            if (status == TransactionStatus.TC_RECODED) {
              retEntries.add(generateRecodeEntry(recovery, bundle, offSetDate))
            }
          }
        }
      }
    }
    return retEntries
  }

  function generateCreationOrVoidEntry(recovery : Recovery, bundle : Bundle, date : Date, key : String) : TimelineEntry_SP {
    var entry = new TimelineEntry_SP(bundle)
    entry.TimelineCategory = TimelineCategory_SP.TC_FINANCIALS
    entry.Importance = TimelineImportance_SP.TC_HIGH
    entry.EventDate = (date == null) ? DateUtil.currentDate() : date
    var user = (key == "Created") ? recovery.CreateUser : recovery.UpdateUser
    if (user == null) {
      user = User.util.CurrentUser
    }
    entry.Summary = DisplayKey.get("SP.Timeline.Summary.Recovery." + key,
        new Object[]{recovery.ReservingAmount,
        recovery.Payer.DisplayName,
        recovery.ReserveLine.DisplayName,
        recovery.RecoveryCategory.Code,
        user.DisplayName})
    addLinks(recovery, entry, bundle, true, user)
    return entry
  }

  function generateRecodeEntry(recovery : Recovery, bundle : Bundle, date : Date) : TimelineEntry_SP {
    var entry = new TimelineEntry_SP(bundle)
    entry.EventDate = (date == null) ? DateUtil.currentDate() : date
    entry.TimelineCategory = TimelineCategory_SP.TC_FINANCIALS
    entry.Importance = TimelineImportance_SP.TC_LOW
    var onsets = recovery.Onsets.map(\o -> o.Onset).where(\o -> (o typeis Recovery))
    var onsetRecoveries = onsets.cast(Recovery)
    var numOnsets = onsetRecoveries.length
    var onsetString = onsetRecoveries[0].ReserveLine.DisplayName + " - " + onsetRecoveries[0].RecoveryCategory.Code
    var user = (recovery.UpdateUser == null) ? User.util.CurrentUser : recovery.UpdateUser

    for (i in 1..|numOnsets) {
      if (numOnsets != 2) {
        onsetString += ","
      }
      onsetString += " "
      var next = onsetRecoveries[i].ReserveLine.DisplayName + " - " + onsetRecoveries[i].RecoveryCategory.Code
      onsetString += next
    }

    entry.Summary = DisplayKey.get("SP.Timeline.Summary.Recovery.Recoded", {
        recovery.ReservingAmount,
        recovery.ReserveLine.DisplayName,
        recovery.RecoveryCategory.Code,
        onsetString,
        user.DisplayName})
    addLinks(recovery, entry, bundle, false, user)
    return entry
  }

  function generateTransferEntry(recovery : Recovery, bundle : Bundle, date : Date, key : String) : TimelineEntry_SP {
    var entry = new TimelineEntry_SP(bundle)
    entry.EventDate = (date == null) ? DateUtil.currentDate() : date
    entry.TimelineCategory = TimelineCategory_SP.TC_FINANCIALS
    entry.Importance = TimelineImportance_SP.TC_HIGH
    var user : User = null
    var otherClaim : Claim = null
    var onset : Recovery = null
    if (key == "Onset") {
      user = recovery.CreateUser
      onset = recovery
      otherClaim = recovery.getRecoveryBeingOffset().Claim
    } else {
      user = recovery.UpdateUser
      onset = recovery.Onsets.first().Onset as Recovery
      otherClaim = onset.Claim
    }
    if (user == null) {
      user = User.util.CurrentUser
    }
    entry.Summary = DisplayKey.get("SP.Timeline.Summary.Recovery.Transferred." + key,
        new Object[]{recovery.ReservingAmount,
        otherClaim.ClaimNumber,
        onset.ReserveLine.DisplayName,
        onset.RecoveryCategory.Code,
        user.DisplayName})
    addLinks(recovery, entry, bundle, false, user)
    return entry
  }

  function addLinks(recovery : Recovery, entry : TimelineEntry_SP, bundle : Bundle, needPayer : boolean, user: User) {
    var recoveryLink = new TimelineLink_SP(bundle)
    recoveryLink.Bean = recovery
    recoveryLink.Sequence = 0
    entry.addToTimelineLinks(recoveryLink)

    var payer = recovery.Payer
    if (needPayer && (payer != null)) {
      var payerLink = new TimelineLink_SP(bundle)
      payerLink.Bean = payer
      payerLink.Sequence = 1
      entry.addToTimelineLinks(payerLink)
    }

    if (user != null) {
      var userLink = new TimelineLink_SP(bundle)
      userLink.Bean = user
      userLink.Sequence = needPayer ? 2 : 1
      entry.addToTimelineLinks(userLink)
    }

    var exposure = recovery.Exposure
    if (exposure != null) {
      var exposureLink = new TimelineLink_SP(bundle)
      exposureLink.Bean = exposure
      entry.addToTimelineLinks(exposureLink)
    }

    var contact = recovery.ClaimContact.Contact
    if (contact != null) {
      var contactLink = new TimelineLink_SP(bundle)
      contactLink.Bean = contact
      entry.addToTimelineLinks(contactLink)
    }
  }


}
