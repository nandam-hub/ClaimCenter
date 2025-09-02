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
 * Generate timeline entries for reserve changes.
 */
@IncludeInDocumentation
class ReserveTimelineEntryGenerator implements TimelineEntryGenerator {
  /**
   * Queries the database for Reserves that are a part of the claim CLAIM. If the
   * date DATE is not NULL, the DB returns all Reserves before DATE. The Reserves are
   * then ordered by CreateTime and partitioned by ReserveLine. These partitions are
   * sent to generateReserveEntryFromDB to process and reconstruct the history of the
   * ReserveLine and produce TimelineEntries
   * @param claim
   * @param date
   * @return
   */
  @IncludeInDocumentation
  public function generateEntries(claim: Claim, date: Date): List<TimelineEntry_SP> {
    var queriedReserves : IQueryBeanResult<Reserve> = null
    if (date == null) {
      //queriedReserves = Queries.createQuery<Reserve>(Reserve)
      queriedReserves = Query.make(Reserve)
          .compare(Reserve#Claim, Relop.Equals, claim)
          .compare(Reserve#Status, Relop.Equals, TransactionStatus.TC_SUBMITTED)
          .select()
          .orderBy(QuerySelectColumns.path(Paths.make(entity.Reserve#CreateTime))) as IQueryBeanResult<Reserve>
    } else {
      //queriedReserves = Queries.createQuery<Reserve>(Reserve)
      queriedReserves = Query.make(Reserve)
          .compare(Reserve#Claim, Relop.Equals, claim)
          .compare(Reserve#Status, Relop.Equals, TransactionStatus.TC_SUBMITTED)
          .compare(Reserve#CreateTime, Relop.LessThan, date)
          .select()
          .orderBy(QuerySelectColumns.path(Paths.make(entity.Reserve#CreateTime))) as IQueryBeanResult<Reserve>
    }
    var reservesList = queriedReserves.toTypedArray()
    //var lineItemSums = Queries.createQuery<TransactionLineItem>(TransactionLineItem)
    var lineItemSums = Query.make(TransactionLineItem)
        .compareIn("Transaction", reservesList)
        .select({QuerySelectColumns.path(Paths.make(entity.TransactionLineItem#Transaction)),
            QuerySelectColumns.dbFunction(DBFunction.Sum(Paths.make(TransactionLineItem#ReservingAmount)))})
    var amountMap = new HashMap<Key, BigDecimal>()
    for (row in lineItemSums) {
      amountMap.put(row.getColumn(0) as Key, row.getColumn(1) as BigDecimal)
    }
    var retList = new ArrayList<TimelineEntry_SP>()
    for (partition in reservesList.partition(\r -> r.ReserveLine).values()) {
      retList.addAll(generateReserveEntryFromDB(partition as ArrayList<Reserve>, claim.Bundle, amountMap))
    }
    return retList
  }

  function generateReserveEntryFromDB(reserves : ArrayList<Reserve>,
                                      bundle : Bundle,
                                      map : HashMap<Key, BigDecimal>) : List<TimelineEntry_SP> {

    var lineName = reserves[0].ReserveLine.DisplayName
    var retEntries = new ArrayList<TimelineEntry_SP>()
    var firstReserve = reserves[0]
    var currency = firstReserve.Currency
    var createEntry = new TimelineEntry_SP(bundle)
    createEntry.EventDate = firstReserve.CreateTime
    createEntry.Summary = DisplayKey.get("SP.Timeline.Summary.Reserve.Created",
        map[firstReserve.ID].ofCurrency(currency), lineName, firstReserve.CreateUser.DisplayName)
    createEntry.TimelineCategory = TimelineCategory_SP.TC_FINANCIALS
    createEntry.Importance = TimelineImportance_SP.TC_HIGH
    addLinks(firstReserve, createEntry, bundle)
    retEntries.add(createEntry)

    for (i in 1..|reserves.size()) {
      var currentReserve = reserves[i]
      var currentAmount = map[currentReserve.ID].ofCurrency(currency)
      var currentEntry = new TimelineEntry_SP(bundle)
      currentEntry.EventDate = currentReserve.CreateTime
      if (currentAmount > 0bd.ofCurrency(currency)) {
        currentEntry.Summary = DisplayKey.get("SP.Timeline.Summary.Reserve.Increase", currentAmount.abs(), lineName, currentReserve.CreateUser.DisplayName)
      } else {
        currentEntry.Summary = DisplayKey.get("SP.Timeline.Summary.Reserve.Decrease", currentAmount.abs(), lineName, currentReserve.CreateUser.DisplayName)
      }
      currentEntry.TimelineCategory = TimelineCategory_SP.TC_FINANCIALS
      currentEntry.Importance = TimelineImportance_SP.TC_HIGH
      addLinks(currentReserve, currentEntry, bundle)
      retEntries.add(currentEntry)
    }
    return retEntries
  }

  function addLinks(reserve : Reserve, entry : TimelineEntry_SP, bundle : Bundle) {
    var deltaLink = new TimelineLink_SP(bundle)
    deltaLink.Sequence = 0
    deltaLink.Bean = (reserve)
    entry.addToTimelineLinks(deltaLink)

    var user = (reserve.CreateUser == null) ? User.util.CurrentUser : reserve.CreateUser
    var userLink = new TimelineLink_SP(bundle)
    userLink.Sequence = 1
    userLink.Bean = user
    entry.addToTimelineLinks(userLink)

    var exp = reserve.Exposure
    if (exp != null) {
      var expLink = new TimelineLink_SP(bundle)
      expLink.Bean = exp
      entry.addToTimelineLinks(expLink)
    }
  }
  
  /**
   * Looks in the bundle BUNDLE and creates Reserve Timeline Entries for the claim Claim.
   * @param bundle
   * @param claim
   * @return
   */
  @IncludeInDocumentation
  public function generateEntries(bundle : Bundle, claim : Claim) : List<TimelineEntry_SP> {
    var retEntries = new ArrayList<TimelineEntry_SP>()
    for (reserve in bundle.InsertedBeans) {
      if ((reserve typeis Reserve) && (reserve.Claim == claim) && (reserve.Status == TransactionStatus.TC_SUBMITTING)) {
        retEntries.add(generateReserveEntryInBundle(reserve, bundle))
      }
    }
    return retEntries
  }


  function generateReserveEntryInBundle(reserve : Reserve, bundle : Bundle) : TimelineEntry_SP {
    var reserveLine = reserve.ReserveLine
    var lineName = reserveLine.DisplayName
    var userName = User.util.CurrentUser.DisplayName
    var amount = reserve.ReservingAmount
    var entry  = new TimelineEntry_SP(bundle)
    entry.EventDate = DateUtil.currentDate()
    var initial = reserve.isInitialReserve()
    reserveLine.getTransactionsIterator(true)
    if (initial) {
      //initial &&= (Queries.createQuery<Reserve>(Reserve)
      initial &&= (Query.make(Reserve)
          .compare(Reserve#ReserveLine, Relop.Equals, reserveLine)
          .select()
          .getCount() == 0)
    }
    if (initial) {
      entry.Summary = DisplayKey.get("SP.Timeline.Summary.Reserve.Created",
          {amount,
          lineName,
          userName})
    } else {
      entry.Summary = DisplayKey.get((amount.Amount > 0bd) ? "SP.Timeline.Summary.Reserve.Increase"
          : ("SP.Timeline.Summary.Reserve.Decrease"),
          new Object[]{amount.abs(),
          lineName,
          userName})
    }
    entry.TimelineCategory = TimelineCategory_SP.TC_FINANCIALS
    entry.Importance = TimelineImportance_SP.TC_HIGH
    addLinks(reserve, entry, bundle)
    return entry
  }

}
