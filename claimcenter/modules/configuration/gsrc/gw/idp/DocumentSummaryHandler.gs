package gw.idp

uses gw.api.database.Query
uses gw.api.database.Relop
uses gw.surepath.suite.integration.logging.StructuredLogger

class DocumentSummaryHandler {
  private static var _logger = StructuredLogger.API


  function doPost(body : jsonschema.idp.documentsummary_ext.v1_0.DocumentSummary, claimId : String, docId : String) {
    _logger.info("Document Summary fuction started")
    var document = Query.make(Document).compare(Document#PublicID, Relop.Equals, docId).select().AtMostOneRow
    if (document != null) {
      gw.transaction.Transaction.runWithNewBundle(\bundle -> {
        document = bundle.add(document)
        document.DetailedSummary = body.DetailedSummary
        document.HighLevelSummary = body.HighLevelSummary
      })
    }
    _logger.info("Document Summary fuction completed")
  }

}
