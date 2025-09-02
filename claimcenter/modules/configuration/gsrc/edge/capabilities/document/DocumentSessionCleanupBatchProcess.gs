package edge.capabilities.document

uses gw.processes.BatchProcessBase
uses edge.PlatformSupport.Bundle
uses gw.api.database.Query
uses edge.PlatformSupport.Logger
uses edge.PlatformSupport.Reflection
uses gw.api.util.DateUtil
uses java.lang.Exception
uses edge.util.helper.SessionExpirationUtil

class DocumentSessionCleanupBatchProcess extends BatchProcessBase {

  final private static var _logger = new Logger(Reflection.getRelativeName(DocumentSessionCleanupBatchProcess))

  final public static var EXPIRATION_PROPERTY : String = "documentsession_minutes"

  construct() {
    super(BatchProcessType.TC_PORTALDOCUMENTSESSION_MPEXT)
  }

  override function doWork() {
    // We are invalidating and retiring things that have expired in the 20 minutes
    var expirationTimeMinutes = SessionExpirationUtil.getSessionExpirationForProperty(EXPIRATION_PROPERTY)
    var expiryCutOff = DateUtil.currentDate().addMinutes(-expirationTimeMinutes)

    var sessions = Query.make(PortalSession_MPExt).compare("sessionType", Equals, "Document").compare("issueDate", LessThan, expiryCutOff).select()

    this.OperationsExpected = sessions.Count
    _logger.logDebug("The number of modified addresses is: " + sessions.Count)

    for (sess in sessions) {
      try {
        Bundle.transaction(\ bundle -> {
          var toRemove = bundle.PlatformBundle.loadByPublicId(PortalSession_MPExt, sess.PublicID)
          bundle.delete(toRemove)
          incrementOperationsCompleted()
        }, User.util.UnrestrictedUser)
      } catch (e : Exception) {
        incrementOperationsFailed()
        _logger.logWarn(e)
        _logger.logWarn("Error attempting to delete portal session: " + e)
      }
    }
  }

  /**
   * Only allow one instance of this BatchProcess to run at a time
   *  - to avoid duplicate transactions being commited.
   */
  override property get Exclusive() : boolean {
    return true
  }

  /**
   * This batch process currently ignores the Termination Request.
   * To support it we need to check the TerminateRequested property
   * and return true from this function.
   */
  override function requestTermination() : boolean {
    return false
  }

}
