package gw.surepath.cc.configuration.activitymanagement.workqueue

uses gw.api.locale.DisplayKey
uses gw.pl.persistence.core.Bundle
uses gw.surepath.suite.configuration.annotation.IncludeInDocumentation
uses gw.processes.WorkQueueBase
uses gw.surepath.suite.integration.logging.StructuredLogger
uses gw.api.database.Query

/**
 * Work queue for toggling users as on vacation: override functions findTargets, process/create WorkItem, handleException
 */
@IncludeInDocumentation
class UserOnVacationToggleWorkQueue extends WorkQueueBase<UserPTO_SP, UserVacStatusWorkItem_SP> {
  private var _logger = StructuredLogger.CONFIG.createSubcategoryLogger(DisplayKey.get("SP.ActivityManagement.Logger.ActivityManagement"))

  /**
   * Call WorkQueueBase's constructor with TC_USERAVAILABILITYONVACATION_SP BatchProcessType,
   * the work item entity type,
   * and the UserPTO entity type
   */
  @IncludeInDocumentation
  construct() {
    super (BatchProcessType.TC_USERAVAILABILITYONVACATION_SP, UserVacStatusWorkItem_SP, UserPTO_SP)
  }

  /**
   * @return an iterator of UserPTO_SP vacation records that have not yet been processed
   * and should be made active on a user
   */
  @IncludeInDocumentation
  override function findTargets(): Iterator<UserPTO_SP> {
    var userPTOQuery = Query.make(entity.UserPTO_SP)
    if (_logger.DebugEnabled) {
      userPTOQuery.withLogSQL(true)
    }
    userPTOQuery.compare(UserPTO_SP#BatchProcessDate, Equals, null)
    userPTOQuery.compare(UserPTO_SP#Active, Equals, true)
    userPTOQuery.compare(UserPTO_SP#BeginDate, LessThanOrEquals, Date.Today)
    userPTOQuery.compare(UserPTO_SP#EndDate, GreaterThanOrEquals, Date.Today)
    var resultSet = userPTOQuery.select().iterator()
    return resultSet
  }

  /**
   * Add workItem to bundle and process UserPTO record so that the user is marked on vacation
   * @param workItem
   */
  @IncludeInDocumentation
  override function processWorkItem(workItem: UserVacStatusWorkItem_SP) {
    gw.transaction.Transaction.runWithNewBundle(\ bundle -> {
      var userPTO: UserPTO_SP = null
      var user: User = null
      try {
        _logger.info("STARTED processing UserOnVacationToggleWorkQueue processWorkItem")
        workItem = bundle.add(workItem)
        userPTO = workItem.UserPTO
        userPTO = bundle.add(userPTO)
        user = userPTO.User
        user = bundle.add(user)
        userPTO.User.VacationStatus = VacationStatusType.TC_ONVACATION
        userPTO.Active = true
        userPTO.BatchProcessDate = Date.CurrentDate
        _logger.info("FINISHED processing UserOnVacationToggleWorkQueue processWorkItem")
      } catch (e: Exception) {
        _logger.error("Error during bundle call: " + e.StackTraceAsString, UserOnVacationToggleWorkQueue#processWorkItem(UserVacStatusWorkItem_SP))
        throw e
      }
    }, User.util.UnrestrictedUser)
  }

  /**
   * @param bean the UserPTO_SP record for which we are creating a work item
   * @param bundle the bundle in which to create and commit the work item
   * @return the bean's newly created user on vacation toggle work item
   */
  @IncludeInDocumentation
  override function createWorkItem(bean : UserPTO_SP, bundle : Bundle) : UserVacStatusWorkItem_SP {
    var pmtWorkItem = new UserVacStatusWorkItem_SP(bundle)
    pmtWorkItem.QueueType = BatchProcessType.TC_USERAVAILABILITYONVACATION_SP
    pmtWorkItem.UserPTO = bean
    return pmtWorkItem
  }


  /**
   * Call superclass to handle exceptions on work item processing
   * @param workItem the work item to mark as failed or to retry
   * @param exception the exception on the work item
   * @param numExceptions the number of exceptions that have occurred on this work item
   * @return boolean value indicating how the exception has been handled
   */
  @IncludeInDocumentation
  override function handleException(workItem: UserVacStatusWorkItem_SP, exception: Throwable, numExceptions: int): boolean {
    return super.handleException(workItem, exception, numExceptions)
  }
}