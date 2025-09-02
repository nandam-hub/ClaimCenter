package gw.surepath.cc.configuration.timeline.creation.generators

uses gw.api.database.DBFunction
uses gw.api.database.IQueryBeanResult
//uses gw.api.database.Queries
uses gw.api.database.Query
uses gw.api.database.QuerySelectColumns
uses gw.api.database.Relop
uses gw.api.locale.DisplayKey
uses gw.api.path.Paths
uses gw.api.util.DateUtil
uses gw.pl.persistence.core.Bundle
uses gw.pl.persistence.core.Key
uses gw.surepath.suite.configuration.annotation.IncludeInDocumentation

uses java.math.BigDecimal
uses java.util.ArrayList
uses java.util.Date
uses java.util.HashMap

/**
 * Generate timeline entries for recovery reserves.
 */
@IncludeInDocumentation
class RecoveryReserveTimelineEntryGenerator implements TimelineEntryGenerator{
  public function generateEntries(claim: Claim, date: Date): List<TimelineEntry_SP> {
    var retEntries= new ArrayList<TimelineEntry_SP>()
    var queriedRecoveryReserves: IQueryBeanResult<RecoveryReserve> = null
    if (date == null) {
      //queriedRecoveryReserves = Queries.createQuery<RecoveryReserve>(RecoveryReserve)
      queriedRecoveryReserves = Query.make(RecoveryReserve)
          .compare(RecoveryReserve#Claim, Relop.Equals, claim)
          .compare(RecoveryReserve#Status, Relop.Equals, TransactionStatus.TC_SUBMITTED)
          .select()
          .orderBy(QuerySelectColumns.path(Paths.make(entity.RecoveryReserve#CreateTime)))
          as IQueryBeanResult<RecoveryReserve>
    } else {
      //queriedRecoveryReserves = Queries.createQuery<RecoveryReserve>(RecoveryReserve)
      queriedRecoveryReserves = Query.make(RecoveryReserve)
          .compare(Reserve#Claim, Relop.Equals, claim)
          .compare(RecoveryReserve#CreateTime, Relop.LessThan, date)
          .compare(RecoveryReserve#Status, Relop.Equals, TransactionStatus.TC_SUBMITTED)
          .select()
          .orderBy(QuerySelectColumns.path(Paths.make(entity.RecoveryReserve#CreateTime)))
          as IQueryBeanResult<RecoveryReserve>
    }
    var recoveryReservesList = queriedRecoveryReserves.toTypedArray()
    //var lineItemSums = Queries.createQuery<TransactionLineItem>(TransactionLineItem)
    var lineItemSums = Query.make(TransactionLineItem)
        .compareIn("Transaction", recoveryReservesList)
        .select({QuerySelectColumns.path(Paths.make(entity.TransactionLineItem#Transaction)),
            QuerySelectColumns.dbFunction(DBFunction.Sum(Paths.make(TransactionLineItem#ReservingAmount)))})


    var amountMap = new HashMap<Key, BigDecimal>()
    for (row in lineItemSums) {
      amountMap.put(row.getColumn(0) as Key, row.getColumn(1) as BigDecimal)
    }
    for (partition in recoveryReservesList.partition(\r -> r.ReserveLine).values()) {
      retEntries.addAll(generateRecoveryReserveEntriesFromDB(partition as ArrayList<RecoveryReserve>, claim.Bundle, amountMap))
    }
    return retEntries
  }

  function generateRecoveryReserveEntriesFromDB(recoveryReserves : ArrayList<RecoveryReserve>,
                                                bundle : Bundle,
                                                map : HashMap<Key, BigDecimal>) : List <TimelineEntry_SP> {
    var entries = new ArrayList<TimelineEntry_SP>()

    var firstRecoveryReserve = recoveryReserves.first()
    var currency = firstRecoveryReserve.Currency
    var lineName = firstRecoveryReserve.ReserveLine.DisplayName
    var baseKey = "SP.Timeline.Summary.RecoveryReserve."
    var createEntry = new TimelineEntry_SP(bundle)
    createEntry.EventDate = firstRecoveryReserve.CreateTime
    createEntry.Summary = DisplayKey.get(baseKey + "Created",
        {map[firstRecoveryReserve.ID].ofCurrency(currency),
	      lineName,
	      firstRecoveryReserve.RecoveryCategory.Code,
	      firstRecoveryReserve.CreateUser.DisplayName})
    createEntry.TimelineCategory = TimelineCategory_SP.TC_FINANCIALS
    createEntry.Importance = TimelineImportance_SP.TC_HIGH
    addLinks(firstRecoveryReserve, createEntry, bundle)
    entries.add(createEntry)

    for (i in 1..|recoveryReserves.size()) {
      var currentRecoveryReserve = recoveryReserves[i]
      var currentAmount = map[currentRecoveryReserve.ID].ofCurrency(currency)
      var currentEntry = new TimelineEntry_SP(bundle)
      currentEntry.EventDate = currentRecoveryReserve.CreateTime
      currentEntry.Summary = DisplayKey.get(baseKey + ((currentAmount > 0bd.ofDefaultCurrency())
            ? "Increase" : "Decrease"),
	        new Object[]{currentAmount.abs(),
	        lineName,
	        currentRecoveryReserve.RecoveryCategory.Code,
	        currentRecoveryReserve.CreateUser.DisplayName})
      currentEntry.TimelineCategory = TimelineCategory_SP.TC_FINANCIALS
      currentEntry.Importance = TimelineImportance_SP.TC_HIGH
      addLinks(currentRecoveryReserve, currentEntry, bundle)
      entries.add(currentEntry)
    }
    return entries
  }

  public function generateEntries(bundle : Bundle, claim : Claim) : List<TimelineEntry_SP> {
    var retEntries = new ArrayList<TimelineEntry_SP>()
    for (recoveryReserve in bundle.InsertedBeans) {
      if ((recoveryReserve typeis RecoveryReserve)
          && (recoveryReserve.Claim == claim)
          && (recoveryReserve.Status == TransactionStatus.TC_SUBMITTING)) {
        retEntries.add(generateReserveEntryInBundle(recoveryReserve, bundle))
      }
    }
    return retEntries
  }

  function generateReserveEntryInBundle(recoveryReserve : RecoveryReserve, bundle : Bundle) : TimelineEntry_SP {
    var entry = new TimelineEntry_SP(bundle)
    var amount = recoveryReserve.ReservingAmount
    var line = recoveryReserve.ReserveLine
    var lineName = line.DisplayName
    var userName = (recoveryReserve.CreateUser == null) ? User.util.CurrentUser.DisplayName
        : recoveryReserve.CreateUser.DisplayName
    entry.EventDate = DateUtil.currentDate()
    if (Query.make(RecoveryReserve)
        .compare(RecoveryReserve#ReserveLine, Relop.Equals, line).select().getCount() == 0) {
      entry.Summary = DisplayKey.get("SP.Timeline.Summary.RecoveryReserve.Created",
          {amount,
	        lineName,
          recoveryReserve.RecoveryCategory.Code,
	        userName})
    } else {
      entry.Summary = DisplayKey.get((amount > 0bd.ofDefaultCurrency()) ? "SP.Timeline.Summary.RecoveryReserve.Increase"
            : ("SP.Timeline.Summary.RecoveryReserve.Decrease"),
	        new Object[]{amount.abs(),
	        lineName,
          recoveryReserve.RecoveryCategory.Code,
	        userName})
    }
    entry.TimelineCategory = TimelineCategory_SP.TC_FINANCIALS
    entry.Importance = TimelineImportance_SP.TC_HIGH
    addLinks(recoveryReserve, entry, bundle)
    return entry
  }

  function addLinks(recoveryReserve : RecoveryReserve, entry : TimelineEntry_SP, bundle : Bundle) {
    var recoveryReserveLink = new TimelineLink_SP(bundle)
    recoveryReserveLink.Bean = recoveryReserve
    recoveryReserveLink.Sequence =0
    entry.addToTimelineLinks(recoveryReserveLink)

    var user = (recoveryReserve.CreateUser == null) ? User.util.CurrentUser : recoveryReserve.CreateUser
    var userLink = new TimelineLink_SP(bundle)
    userLink.Bean = user
    userLink.Sequence = 1
    entry.addToTimelineLinks(userLink)

    var exp = recoveryReserve.Exposure
    if (exp != null) {
      var expLink = new TimelineLink_SP(bundle)
      expLink.Bean = exp
      entry.addToTimelineLinks(expLink)
    }

  }
}
