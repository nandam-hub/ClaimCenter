package gw.surepath.cc.configuration.timeline.creation.generators

uses gw.api.database.IQueryBeanResult
uses gw.api.database.Queries
uses gw.api.database.Relop
uses gw.api.locale.DisplayKey
uses gw.surepath.cc.configuration.timeline.creation.TimelineUtil
uses gw.api.util.DateUtil
uses gw.pl.persistence.core.Bundle
uses gw.surepath.suite.configuration.annotation.IncludeInDocumentation

uses java.util.ArrayList
uses java.util.Date

/**
 * Generate timeline entries for checks. Generates entries for different phases of check handling
 * during the cliam timeline like transfer, stopped or voided entries. Also creates links related to
 * creation and approval entries
 */
@IncludeInDocumentation
class CheckTimelineEntryGenerator implements TimelineEntryGenerator {

  /**
   * Queries the database and creates Timeline Entries. Entries are created when a
   * check is created, approved, rejected, transferred, recoded, stopped, or voided.
   * The checks pulled from the database are those whose claim is CLAIM. The DATE
   * parameter dictates whether the DB filters on certain criteria. Checks going
   * through DB selection must satisfy one of three conditions:
   *     1. It's create time is before the given date,
   *     2. It's approval/rejection date was before the given date, or
   *     3. It's status was set to transferred, voided, recoded, or stopped before
   *        the given date.
   * @param claim
   * @param date
   * @return
   */
  @IncludeInDocumentation
  public function generateEntries(claim: Claim, date: Date): List<TimelineEntry_SP> {
    var checks : IQueryBeanResult<Check> = null
    var bundle = claim.Bundle
    if (date == null) {
      checks = Queries.createQuery<Check>(Check)
          .compare(Check#Claim, Relop.Equals, claim)
          .select()
    } else {
      checks = Queries.createQuery<Check>(Check)
          .compare(Check#Claim, Relop.Equals, claim)
          .compare(Check#CreateTime, Relop.LessThan, date)
          .select()
    }
    var retEntries = new ArrayList<TimelineEntry_SP>()
    for (check in checks) {
      if ((date == null) || (check.CreateTime < date)) {
        if (check.TransferredCheck != null) {
          retEntries.add(generateTransferEntry(check, bundle, check.CreateTime, true))
        } else {
          retEntries.add(generateCreationEntry(check, bundle, check.CreateTime))
        }
      }
      var approvalStatus = check.CheckSet.ApprovalStatus
      if (approvalStatus != ApprovalStatus.TC_UNAPPROVED) {
        var approvalDate = check.CheckSet.ApprovalDate
        if ((date == null) || (approvalDate < date)) {
          retEntries.add(generateApprovalEntry(check, bundle, approvalDate))
        }
        var status = check.Status
        if ((status == TransactionStatus.TC_STOPPED) || (status == TransactionStatus.TC_VOIDED)) {
          var haltOffsetDate = check.Payments.firstWhere(\elt -> elt.OffsetPayment).CreateTime
          if ((date == null) || (haltOffsetDate < date)) {
            retEntries.add(generateStoppedVoidedEntry(check,
                bundle,
                (status == TransactionStatus.TC_STOPPED) ? "SP.Timeline.Summary.Check.Stopped"
                    : ("SP.Timeline.Summary.Check.Voided"),
                haltOffsetDate))
          }
        }
        if (status == TransactionStatus.TC_TRANSFERRED) {
          var otherCheckDate = check.TransferredToCheck.CreateTime
          if ((date == null) || (otherCheckDate < date)) {
            retEntries.add(generateTransferEntry(check, bundle, otherCheckDate, false))
          }
        }
        if (status == TransactionStatus.TC_ISSUED) {
          var issueDate = check.IssueDate
          if ((date == null) || (issueDate < date)) {
            retEntries.add(generateIssueEntry(check, bundle, issueDate))
          }
        }
        var recodedPayments = check.Payments.where(\p -> (p.Status == TransactionStatus.TC_RECODED))
        if (recodedPayments.HasElements) {
          for (payment in recodedPayments) {
            var recodingOffSetDate = payment.Offsets.first().Offset.CreateTime
            if ((date == null) || (recodingOffSetDate < date)) {
              retEntries.add(generatePaymentRecodeEntry(payment, bundle, recodingOffSetDate))
            }
          }
        }
      }
    }
    return retEntries
  }

  /**
   * Returns all the Timeline Entries for a claim that are relevent to checks in the
   * bundle BUNDLE. This method checks if the check is new or recently approved,
   * rejected, transferred, voided or stopped, and produces corresponding Timeline
   * Entries
   * @param bundle
   * @param claim
   * @return
   */
  @IncludeInDocumentation
  public function generateEntries(bundle : Bundle, claim : Claim) : List<TimelineEntry_SP> {
    var retEntries = new ArrayList<TimelineEntry_SP>()
    var status: TransactionStatus = null
    var beans = bundle.InsertedAndUpdatedBeans
    for (bean in beans) {
      if ((bean typeis Check) && (bean.Claim == claim)) {
        var check = bean as Check
        if (check.New) {
          if (check.TransferredCheck != null) {
            retEntries.add(generateTransferEntry(check, bundle, DateUtil.currentDate(), true))
          } else {
            retEntries.add(generateCreationEntry(check, bundle, DateUtil.currentDate()))
          }
        }
        status = check.Status
        if (check.isFieldChanged(Check#Status)) {
          if ((status == TransactionStatus.TC_STOPPED) || (status == TransactionStatus.TC_VOIDED)) {
            retEntries.add(generateStoppedVoidedEntry(check,
                bundle,
                (status == TransactionStatus.TC_STOPPED) ? "SP.Timeline.Summary.Check.Stopped"
                    : ("SP.Timeline.Summary.Check.Voided"),
                check.Payments.firstWhere(\p -> p.OffsetPayment).CreateTime))
          }
          if (status == TransactionStatus.TC_TRANSFERRED) {
            retEntries.add(generateTransferEntry(check, bundle, check.TransferredToCheck.CreateTime, false))
          }
          if (status == TransactionStatus.TC_ISSUED) {
            retEntries.add(generateIssueEntry(check, bundle, check.IssueDate))
          }
        }
      }
      if ((bean typeis CheckSet) && (bean.Claim == claim)) {
        var checkSet = bean as CheckSet
        var approvalStatus = checkSet.ApprovalStatus
        if (((approvalStatus == ApprovalStatus.TC_APPROVED) || (approvalStatus == ApprovalStatus.TC_REJECTED))
            && (checkSet.isFieldChanged(CheckSet#ApprovalStatus) || checkSet.New)) {
          for (c in checkSet.Checks) {
            retEntries.add(generateApprovalEntry(c, bundle, checkSet.ApprovalDate))
          }
        }
      }
      if ((bean typeis Payment) && (bean.Claim == claim)) {
        var payment = bean as Payment
        if (payment.Recoded) {
          retEntries.add(generatePaymentRecodeEntry(payment, bundle, payment.Offsets.first().Offset.CreateTime))
        }
      }
    }
    return retEntries
  }


  function generateApprovalEntry(check : Check, bundle : Bundle, date : Date) : TimelineEntry_SP {
    var checkSet = check.CheckSet
    var user = (checkSet.LastApprovingUser == null) ? User.util.CurrentUser : checkSet.LastApprovingUser
    var entry = new TimelineEntry_SP(bundle)
    entry.TimelineCategory = TimelineCategory_SP.TC_FINANCIALS
    entry.Importance = TimelineImportance_SP.TC_LOW
    entry.EventDate = (date == null) ? DateUtil.currentDate() : date
    entry.Summary = DisplayKey.get(checkSet.Approved ? "SP.Timeline.Summary.Check.Approved"
        : ("SP.Timeline.Summary.Check.Rejected"),
        new Object[]{check.CheckNumber,
        check.GrossAmount,
        generatePayeeString(check),
        TimelineUtil.createLinkTag(check.Payees.length + 2, user.DisplayName)})
    generateLinks(check, entry, bundle, user)
    return entry
  }

  function generateIssueEntry(check : Check, bundle : Bundle, date : Date) : TimelineEntry_SP {
    var entry = new TimelineEntry_SP(bundle)
    entry.TimelineCategory = TimelineCategory_SP.TC_FINANCIALS
    entry.Importance = TimelineImportance_SP.TC_HIGH
    entry.EventDate = (date == null) ? DateUtil.currentDate() : date
    entry.Summary = DisplayKey.get("SP.Timeline.Summary.Check.Issued",
        {check.CheckNumber,
        check.GrossAmount,
        generatePayeeString(check)})
    generateLinks(check, entry, bundle, null)
    return entry
  }

  function generateStoppedVoidedEntry(check : Check, bundle : Bundle, key : String, date : Date) : TimelineEntry_SP {
    var entry = new TimelineEntry_SP(bundle)
    var userName = (check.UpdateUser == null) ? User.util.CurrentUser.DisplayName : check.UpdateUser.DisplayName
    entry.TimelineCategory = TimelineCategory_SP.TC_FINANCIALS
    entry.Importance = TimelineImportance_SP.TC_HIGH
    entry.EventDate = (date == null) ? DateUtil.currentDate() : date
    entry.Summary = DisplayKey.get(key, new Object[]{
        check.CheckNumber,
        check.GrossAmount,
        userName})
    generateStoppedVoidedLinks(check, entry, bundle)
    return entry
  }

  function generateStoppedVoidedLinks(check : Check, entry : TimelineEntry_SP, bundle : Bundle) {
    var checkNumLink = new TimelineLink_SP(bundle)
    checkNumLink.Sequence = 0
    checkNumLink.Bean = check
    entry.addToTimelineLinks(checkNumLink)


    var grossAmtLink = new TimelineLink_SP(bundle)
    grossAmtLink.Sequence = 1
    grossAmtLink.Bean = check
    entry.addToTimelineLinks(grossAmtLink)

    var userLink = new TimelineLink_SP(bundle)
    userLink.Sequence = 2
    userLink.Bean = (check.UpdateUser == null) ? User.util.CurrentUser : check.UpdateUser
    entry.addToTimelineLinks(userLink)

    generateCheckRelatedToLinks(entry, check, bundle)
  }

  function generateTransferEntry(check : Check, bundle : Bundle, date : Date, onset : boolean) : TimelineEntry_SP {
    var entry = new TimelineEntry_SP(bundle)
    entry.TimelineCategory = TimelineCategory_SP.TC_FINANCIALS
    entry.Importance = TimelineImportance_SP.TC_HIGH
    entry.EventDate = (date == null) ? DateUtil.currentDate() : date
    var otherClaim = onset ? check.TransferredCheck.Claim : check.TransferredToCheck.Claim
    entry.Summary = DisplayKey.get(onset ? "SP.Timeline.Summary.Check.Transferred.Onset"
        : ("SP.Timeline.Summary.Check.Transferred.Offset"),
        new Object[]{check.CheckNumber,
        check.GrossAmount,
        otherClaim.ClaimNumber})
    generateTransferredLinks(check, entry, bundle, otherClaim)
    return entry
  }

  function generateTransferredLinks(check : Check, entry : TimelineEntry_SP, bundle : Bundle, otherClaim : Claim) {
    var checkNumLink = new TimelineLink_SP(bundle)
    checkNumLink.Sequence = 0
    checkNumLink.Bean = check
    entry.addToTimelineLinks(checkNumLink)


    var grossAmtLink = new TimelineLink_SP(bundle)
    grossAmtLink.Sequence = 1
    grossAmtLink.Bean = check
    entry.addToTimelineLinks(grossAmtLink)

    var otherClaimLink = new TimelineLink_SP(bundle)
    otherClaimLink.Sequence = 2
    otherClaimLink.Bean = otherClaim
    entry.addToTimelineLinks(otherClaimLink)

    generateCheckRelatedToLinks(entry, check, bundle)
  }


  function generateCreationEntry(check : Check, bundle : Bundle, date : Date) : TimelineEntry_SP {
    var entry = new TimelineEntry_SP(bundle)
    entry.TimelineCategory = TimelineCategory_SP.TC_FINANCIALS
    entry.Importance = TimelineImportance_SP.TC_MEDIUM
    entry.EventDate = (date == null) ? DateUtil.currentDate() : date
    var user = (check.CreateUser == null) ? User.util.CurrentUser : check.CreateUser
    if(check.ScheduledSendDate != null) {
      entry.Summary = DisplayKey.get("SP.Timeline.Summary.Check.Created",
          {check.CheckNumber,
              check.GrossAmount,
              check.ScheduledSendDate,
              generatePayeeString(check),
              TimelineUtil.createLinkTag(check.Payees.length + 2, user.DisplayName)})
    }else{
      entry.Summary = DisplayKey.get("SP.Timeline.Summary.Check.Created.NoDate",
          {check.CheckNumber,
              check.GrossAmount,
              generatePayeeString(check),
              TimelineUtil.createLinkTag(check.Payees.length + 2, user.DisplayName)})
    }
    generateLinks(check, entry, bundle, user)
    return entry
  }

  function generatePaymentRecodeEntry(payment : Payment, bundle : Bundle, date : Date) : TimelineEntry_SP {
    var entry = new TimelineEntry_SP(bundle)
    entry.TimelineCategory = TimelineCategory_SP.TC_FINANCIALS
    entry.Importance = TimelineImportance_SP.TC_LOW
    entry.EventDate = (date == null) ? DateUtil.currentDate() : date

    var onsetReserves = payment.Onsets.map(\o -> o.Onset.ReserveLine.DisplayName)
    var otherReserves = onsetReserves[0]
    var numOtherReserves = onsetReserves.length
    for (i in 1..|numOtherReserves) {
      otherReserves += ", "
      otherReserves += onsetReserves[i]
    }
    var line = payment.ReserveLine
    var user = (payment.UpdateUser == null) ? User.util.CurrentUser : payment.UpdateUser
    entry.Summary = DisplayKey.get("SP.Timeline.Summary.Payment.Recoded",
        {payment.ReservingAmount,
        line.DisplayName,
        otherReserves,
        user.DisplayName})

    var lineLink = new TimelineLink_SP(bundle)
    lineLink.Sequence = 0
    lineLink.Bean = line
    entry.addToTimelineLinks(lineLink)

    if (user != null) {
      var userLink = new TimelineLink_SP(bundle)
      userLink.Sequence = 1
      userLink.Bean = user
      entry.addToTimelineLinks(userLink)
    }

    generatePaymentRelatedToLinks(entry, payment, bundle)
    return entry
  }


  function generateLinks(check : Check, entry : TimelineEntry_SP, bundle : Bundle, user : User) {
    var checkNumLink = new TimelineLink_SP(bundle)
    checkNumLink.Sequence = 0
    checkNumLink.Bean = check
    entry.addToTimelineLinks(checkNumLink)

    var grossAmtLink = new TimelineLink_SP(bundle)
    grossAmtLink.Sequence = 1
    grossAmtLink.Bean = check
    entry.addToTimelineLinks(grossAmtLink)

    var seqNum = 2
    for (contact in check.Payees.map(\p -> p.ClaimContact.Contact)) {
      var payeeLink = new TimelineLink_SP(bundle)
      payeeLink.Sequence = seqNum
      payeeLink.Bean = contact
      entry.addToTimelineLinks(payeeLink)
      seqNum += 1
    }

    if (user != null) {
      var createUserLink = new TimelineLink_SP(bundle)
      createUserLink.Sequence = seqNum
      createUserLink.Bean = user
      entry.addToTimelineLinks(createUserLink)
    }

    generateCheckRelatedToLinks(entry,check, bundle)
  }

  /**
   * This method is used by the Check entry generators to produce strings with the augmented used later to produce links
   * to various payees. This method allows us to have a long list of payees without variation in the display keys.
   * @param check
   * @return
   */
  @IncludeInDocumentation
  function generatePayeeString(check : Check) : String {
    var str = ""
    var contacts = check.Payees.map(\p -> p.ClaimContact.Contact.DisplayName)
    str += "<#2%" + contacts[0] + "%>"
    for (i in 1..|contacts.length) {
      var currSeq = i + 2
      str += ", <#" + currSeq + "%" + contacts[i] + "%>"
    }
    return str
  }

  function generateCheckRelatedToLinks(entry : TimelineEntry_SP, check : Check, bundle : Bundle) {
    if (check.LinkedToServiceRequests) {
      var addedServiceRequests = new ArrayList<ServiceRequest>()
      for (serviceRequest in check.ServiceRequestInvoices.map(\i -> i.ServiceRequest)) {
        if (!addedServiceRequests.contains(serviceRequest)) {
          var serviceRequestLink = new TimelineLink_SP(bundle)
          serviceRequestLink.Bean = serviceRequest
          entry.addToTimelineLinks(serviceRequestLink)
          addedServiceRequests.add(serviceRequest)
        }
      }
    }
    var contact = check.ClaimContact.Contact
    if (contact != null) {
      var contactLink = new TimelineLink_SP(bundle)
      contactLink.Bean = contact
      entry.addToTimelineLinks(contactLink)
    }

    var addedExposures = new ArrayList<Exposure>()
    var addedMatters = new ArrayList<Matter>()
    for (payment in check.Payments) {
      var exposure = payment.Exposure
      if ((exposure != null) && !addedExposures.contains(exposure)) {
        var exposureLink = new TimelineLink_SP(bundle)
        exposureLink.Bean = (exposure)
        entry.addToTimelineLinks(exposureLink)
        addedExposures.add(exposure)
      }
      var matter = payment.Matter
      if ((matter != null) && !addedMatters.contains(matter)) {
        var matterLink = new TimelineLink_SP(bundle)
        matterLink.Bean = (matter)
        entry.addToTimelineLinks(matterLink)
        addedMatters.add(matter)
      }
    }
    var addedContacts = new ArrayList<Contact>()
    for (payeeContact in check.Payees.map(\p -> p.ClaimContact.Contact).where(\c -> (c != contact))) {
      if (addedContacts.contains(contact))  {
        var payeeContactLink = new TimelineLink_SP(bundle)
        payeeContactLink.Bean = (payeeContact)
        entry.addToTimelineLinks(payeeContactLink)
        addedContacts.add(payeeContact)
      }
    }
  }

  function generatePaymentRelatedToLinks(entry : TimelineEntry_SP, payment : Payment, bundle : Bundle) {
    var check = payment.Check
    if (check.LinkedToServiceRequests) {
      var addedServiceRequests = new ArrayList<ServiceRequest>()
      for (serviceRequest in check.ServiceRequestInvoices.map(\i -> i.ServiceRequest)) {
        if (!addedServiceRequests.contains(serviceRequest)) {
          var serviceRequestLink = new TimelineLink_SP(bundle)
          serviceRequestLink.Bean = (serviceRequest)
          entry.addToTimelineLinks(serviceRequestLink)
          addedServiceRequests.add(serviceRequest)
        }
      }
    }

    var contact = check.ClaimContact.Contact
    if (contact != null) {
      var contactLink = new TimelineLink_SP(bundle)
      contactLink.Bean = (contact)
      entry.addToTimelineLinks(contactLink)
    }

    var exposure = payment.Exposure
    if (exposure != null) {
      var exposureLink = new TimelineLink_SP(bundle)
      exposureLink.Bean = (exposure)
      entry.addToTimelineLinks(exposureLink)
    }
    var matter = payment.Matter
    if (matter != null) {
      var matterLink = new TimelineLink_SP(bundle)
      matterLink.Bean = (matter)
      entry.addToTimelineLinks(matterLink)

    }
  }
}
