package gw.entity

uses entity.Activity
uses entity.ServiceRequestStatement
uses gw.api.metric.MetricLimitStatus
uses gw.api.util.DateUtil
uses gw.core.vendormanagement.servicerequeststate.ActionDefinition
uses gw.core.vendormanagement.servicerequeststate.ServiceRequestOperationContext
uses gw.core.vendormanagement.servicerequeststate.ServiceRequestStateHandler
uses gw.plugin.Plugins
uses gw.plugin.vendormanagement.IServiceRequestLifecycle
uses gw.vendormanagement.ServiceRequestActivityPattern
uses gw.vendormanagement.ServiceRequestStatus

/**
 * Enhancement on ServiceRequest with methods for state transitions
 */

@Export
enhancement GWServiceRequestStateEnhancement : entity.ServiceRequest {

  /**
   * Checks if any of the given operations are available to anyone
   */
  function anyOperationAvailable (operations: Collection<ServiceRequestOperation>, stateHandler : ServiceRequestStateHandler = null): boolean {
    return operations.hasMatch(\ operation -> this.CoreSR.operationAvailable(operation, false, stateHandler))
  }

  /**
   * Gets whether the Service Request is in an "active" state
   */
  property get IsActive(): boolean {
    return this.Progress != ServiceRequestProgress.TC_CANCELED
        and this.Progress != ServiceRequestProgress.TC_EXPIRED
        and this.Progress != ServiceRequestProgress.TC_DECLINED
  }

  /**
   * Gets whether the Service Request is in a "done" state
   */
  property get IsDone(): boolean {
    return this.Progress == ServiceRequestProgress.TC_WORKCOMPLETE
  }

  /**
   * Returns whether this ServiceRequest is "overdue", which indicates that an expected completion date has
   * passed without the specialist performing the desired action.
   * @return  true if the ServiceRequest is overdue
   */
  function isOverdue(stateHandler : ServiceRequestStateHandler = null): boolean {
    var currentDate = Date.CurrentDate
    var stateHandlerSafe = (stateHandler ?: createStateHandler())
    return stateHandlerSafe.isExpectedQuoteCompletionDateApplicable(this) and
                   this.ExpectedQuoteCompletionDateGw < currentDate  or
           stateHandlerSafe.isExpectedServiceCompletionDateApplicable(this) and
                   this.ExpectedServiceCompletionDateGw < currentDate
  }


  /**
   * Gets whether the Action required icon should be displayed
   */
  function actionRequiredVisible(stateHandler: ServiceRequestStateHandler = null): boolean {
    return this.Progress == ServiceRequestProgress.TC_DRAFT
        or (this.IsActive
            and (this.QuoteStatus == ServiceRequestQuoteStatus.TC_WAITINGFORAPPROVAL
            or this.Invoices.hasMatch(\ i -> i.ActionRequiredVisible))
        )
        or (this.nextActionDefinition(stateHandler).ActionOwner != null
            and this.nextActionDefinition(stateHandler).ActionOwner == this.AssignedUser.Contact)
  }

  /**
   * Gets the action required icon for this Service Request
   */
  function actionRequiredIcon(stateHandler : ServiceRequestStateHandler = null) : ServiceRequestStatus {
    return actionRequiredVisible(stateHandler) ? ServiceRequestStatus.ATTENTION : ServiceRequestStatus.NONE
  }

  /**
   * Gets the status icon for this Service Request
   */
  property get StatusIcon(): ServiceRequestStatus {
    var progress = this.Progress
    if (progress == ServiceRequestProgress.TC_REQUESTED) {
      return convertMetricStatusToServiceRequestStatus(this.SpecialistInitialResponseTimeServiceRequestMetric.Status)

    } else if (progress == ServiceRequestProgress.TC_SPECIALISTWAITING or progress == ServiceRequestProgress.TC_INPROGRESS) {
      var metricStatus = ServiceRequestStatus.GREEN

      if (this.ServiceTimelinessServiceRequestMetric.StartTime != null) {
        metricStatus = convertMetricStatusToServiceRequestStatus(this.ServiceTimelinessServiceRequestMetric.Status)
      } else if (this.QuoteTimelinessServiceRequestMetric.StartTime  != null) {
        metricStatus = convertMetricStatusToServiceRequestStatus(this.QuoteTimelinessServiceRequestMetric.Status)
      }
      return metricStatus
    } else if (progress == ServiceRequestProgress.TC_WORKCOMPLETE) {
       return ServiceRequestStatus.COMPLETE
    }
    return ServiceRequestStatus.INACTIVE // all other progress values, including draft, declined, canceled, and expired
  }

  /**
   * Gets the corresponding ServiceRequestStateIcon for the metricIcon.
   */
  private function convertMetricStatusToServiceRequestStatus(metricStatus: MetricLimitStatus): ServiceRequestStatus {
    switch (metricStatus) {
      case MetricLimitStatus.NONE:       return ServiceRequestStatus.NONE
      case MetricLimitStatus.INACTIVE:   return ServiceRequestStatus.INACTIVE
      case MetricLimitStatus.GREEN:      return ServiceRequestStatus.GREEN
      case MetricLimitStatus.YELLOW:     return ServiceRequestStatus.YELLOW
      case MetricLimitStatus.RED:        return ServiceRequestStatus.RED
      default:                           return ServiceRequestStatus.NONE
    }
  }

  /**
   * Gets the next action definition
   */
  function nextActionDefinition(stateHandler : ServiceRequestStateHandler = null) : ActionDefinition {
    stateHandler = stateHandler ?: createStateHandler()
    return stateHandler.getNextAction(this)
  }

  property get CompletionDate() : Date {
    return this.Progress == ServiceRequestProgress.TC_WORKCOMPLETE ?
        this.OrderedHistory.lastWhere(\ c -> c.New_Progress == ServiceRequestProgress.TC_WORKCOMPLETE).Timestamp :
        null
  }

  /**
   * @return All of the terminal states for each Kind of ServiceRequest.
   */
  static property get TerminalProgressValues() : Map<ServiceRequestKind, Set<ServiceRequestProgress>> {
    return ServiceRequestStateHandler.AllTerminalProgressValues
  }

  /**
   * Returns whether this ServiceRequest has reached a terminal progress value
   */
  property get Terminated() : boolean {
    return isProgressTerminal(this.Progress)
  }

  /**
   * Returns whether the specified Progress would be terminal for this ServiceRequest
   */
  function isProgressTerminal(progress : ServiceRequestProgress) : boolean {
    return createStateHandler().isProgressTerminal(progress)
  }

  /**
   * Returns whether this ServiceRequest can have quotes
   */
  function quoteAllowed(stateHandler : ServiceRequestStateHandler = null) : boolean {
    return (stateHandler ?: createStateHandler()).AllowsQuote
  }

  /**
   * Returns whether this ServiceRequest can have invoices
   */
  function invoiceAllowed(stateHandler : ServiceRequestStateHandler = null) : boolean {
    return (stateHandler ?: createStateHandler()).AllowsInvoices
  }

  /**
   * Retrieves the instance for each ServiceRequestKind implementation
   * @return new implementation instance corresponding to this.Kind
   */
  function createStateHandler() : ServiceRequestStateHandler {
    return Plugins.get(IServiceRequestLifecycle).createStateHandler(this.Kind)
  }

  /**
   * Gets whether this service request has been in "specialist waiting" state
   * for more than a global threshold.
   */
  property get PassedWaitingThreshold(): boolean {
    var changeToWaitingStateDate = DateChangedToWaitingState
    return this.Progress == ServiceRequestProgress.TC_SPECIALISTWAITING
           and changeToWaitingStateDate != null
           and (changeToWaitingStateDate.businessDaysBetween(Date.CurrentDate, this.Instruction.ServiceAddressGw) > this.GlobalSpecialistWaitingThreshold)
  }

  /**
   * Gets the Expected Completion date based on the Service Request state
   */
  function nextExpectedCompletionDate(stateHandler : ServiceRequestStateHandler = null): Date {
    if (expectedQuoteCompletionDateApplies(stateHandler)){
      return this.ExpectedQuoteCompletionDateGw
    } else if (expectedServiceCompletionDateApplies(stateHandler)) {
      return this.ExpectedServiceCompletionDateGw
    }
    return null
  }

  /**
   * Gets whether the expected quote completion date can be updated
   */
  function expectedQuoteCompletionDateApplies(stateHandler : ServiceRequestStateHandler = null): boolean {
    return (stateHandler ?: createStateHandler()).isExpectedQuoteCompletionDateApplicable(this)
  }

  /**
   * Gets whether the expected service completion date can be updated
   */
  function expectedServiceCompletionDateApplies(stateHandler : ServiceRequestStateHandler = null): boolean {
    return (stateHandler ?: createStateHandler()).isExpectedServiceCompletionDateApplicable(this)
  }

  /**
   * Perform the operation for updating the corresponding expected completion date with the
   * newExpectedCompletionDate and record the change.
   */
  function setExpectedCompletionDateAndRecordChange(newExpectedCompletionDate: Date, changeReason: String, isSpecialist : boolean, isService : boolean, stateHandler : ServiceRequestStateHandler = null) {
    var context = new ServiceRequestOperationContext(){:ExpectedCompletionDate = newExpectedCompletionDate,
                                                                           :Reason = changeReason?: "",
                                                                           :OriginalDate = expectedQuoteCompletionDateApplies(stateHandler) ? this.ExpectedQuoteCompletionDateGw : this.ExpectedServiceCompletionDateGw}
    this.CoreSR.performOperation(isService ? TC_UPDATESERVICEECD : TC_UPDATEQUOTEECD, context, isSpecialist, stateHandler)
  }

  /**
   * Perform the operation for accepting the work and record the change. This includes setting the expected completion date
   * to the corresponding field based on the service request state
   */
  function acceptWorkAndRecordChange(expectedCompletionDate: Date, isSpecialist : boolean) {
    var context = new ServiceRequestOperationContext(){:ExpectedCompletionDate = (expectedCompletionDate == null) ? DateUtil.currentDate() : expectedCompletionDate}
    this.CoreSR.performOperation(TC_SPECIALISTACCEPTEDWORK, context, isSpecialist)
  }

  function isInstructedToProvideQuote(stateHandler : ServiceRequestStateHandler = null): boolean {
    return (stateHandler ?: createStateHandler()).isInstructedToProvideQuote(this)
  }

  /**
   * Creates a new activity assigned to the Service Request Owner indicating an operation was performed.
   */
  function createNewActivity(activityPattern: ServiceRequestActivityPattern): Activity {
    return createNewActivity(activityPattern, null, null, null)
  }

  /**
   * Creates a new activity assigned to the Service Request Owner indicating an operation was performed.
   */
  function createNewActivity(activityPattern: ActivityPattern): Activity {
    return createNewActivity(activityPattern, null, null, null)
  }

  /**
   * Creates a new activity assigned to the Service Request Owner indicating an operation was performed.
   * The new activity contains the statement documents
   */
  function createNewActivity(activityPattern: ServiceRequestActivityPattern, statement: ServiceRequestStatement): Activity {
    return createNewActivity(activityPattern, null, null, statement)
  }

  /**
   * Creates a new activity assigned to the Service Request Owner indicating a change made to the service request.
   * This method is used to indicate when an specialist performed an operation
   */
  function createNewActivity(pattern: ServiceRequestActivityPattern, subject: String, description: String, statement: ServiceRequestStatement): Activity {
    return createNewActivity(pattern.Pattern, subject, description, statement)
  }

  /**
   * Creates a new activity assigned to the Service Request Owner indicating a change made to the service request.
   * This method is used to indicate when an specialist performed an operation
   */
  function createNewActivity(activityPattern: ActivityPattern, subject: String, description: String, statement: ServiceRequestStatement): Activity {
    var activity = this.Claim.createActivityFromPattern(null, activityPattern)
    activity.RelatedTo = this
    activity.assignUserAndDefaultGroup(this.AssignedUser)
    if (subject.HasContent) {
      activity.Subject = subject
    }
    if (description.HasContent) {
      activity.Description = description
    }
    if (statement != null) {
      statement.Documents.each(\ d -> activity.addLinkedDocument(d))
    }
    this.addToActivities(activity)
    return activity
  }

  function isInstructedToPerformService(stateHandler : ServiceRequestStateHandler = null): boolean {
    return (stateHandler ?: createStateHandler()).isInstructedToPerformService(this)
  }

  /**
   * Gets the date when the Service Request last changed to "specialist waiting" state
   */
  private property get DateChangedToWaitingState(): Date {
    return this.OrderedHistory
               .lastWhere(\ change -> change.Progress_Chg and change.New_Progress == ServiceRequestProgress.TC_SPECIALISTWAITING)
               .Timestamp
  }
}
