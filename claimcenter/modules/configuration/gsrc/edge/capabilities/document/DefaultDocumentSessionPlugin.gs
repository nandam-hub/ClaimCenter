package edge.capabilities.document

uses edge.PlatformSupport.Bundle
uses edge.di.annotations.ForAllGwNodes
uses edge.jsonrpc.exception.JsonRpcSecurityException
uses gw.api.util.DateUtil
uses gw.api.database.Query
uses java.util.UUID
uses java.util.Date
uses edge.util.helper.UserUtil

/**
 * Default implementation of document session plugin.
 */
final class DefaultDocumentSessionPlugin implements IDocumentSessionPlugin {
  public static final var DOCUMENT_SESSION_EXPIRATION_MINUTES : int = 10


  @ForAllGwNodes
  construct() {
  }


  override function getDocumentSession(docId : String) : String {
    var uuid = UUID.randomUUID().toString()
    var username = User.util.CurrentUser.Credential.UserName
    final var sess = Bundle.resolveInTransaction(\ bundle -> {
      final var mtSession = new PortalSession_MPExt()
      mtSession.sessionType = "Document"
      mtSession.sessionUUID = uuid
      mtSession.username = username
      mtSession.issueDate = DateUtil.currentDate()
      mtSession.foreignId = docId
      return mtSession
    });
    return sess.sessionUUID
  }

  override function getSessionDocumentId(sessionUUID: String): String {
    if (!sessionUUID.HasContent) {
      throw new JsonRpcSecurityException(){: Message = "Invalid session"}
    }

    final var results = Query.make(PortalSession_MPExt).compare("sessionUUID", Equals, sessionUUID).select()
    if (results.Count != 1) {
      throw new JsonRpcSecurityException(){: Message = "Invalid session"}
    }
    final var sess = results.FirstResult


    if (!"Document".equals(sess.sessionType)) {
      throw new JsonRpcSecurityException(){: Message = "Invalid session"}
    }

    if (!DateUtil.addMinutes(sess.issueDate, DOCUMENT_SESSION_EXPIRATION_MINUTES).after(Date.CurrentDate)) {
      throw new JsonRpcSecurityException(){: Message = "Invalid session"}
    }

    return sess.foreignId;
  }

  override function getSessionUser(sessionUUID: String): User {
       final var results = Query.make(PortalSession_MPExt).compare("sessionUUID", Equals, sessionUUID).select()
       final var sess = results.FirstResult
       return UserUtil.getUserByName(sess.username)
  }

  override property get Expiration(): int {
    return DOCUMENT_SESSION_EXPIRATION_MINUTES
  }
}
