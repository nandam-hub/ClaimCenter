package gw.solr.utils

uses gw.api.locale.DisplayKey
uses gw.api.solr.CCSolrConfig
uses gw.api.system.CCLoggerCategory
uses gw.api.system.server.ServerModeUtil
uses gw.cc.config.Resources
uses gw.plugin.solr.SolrSearchStore
uses gw.solr.GWSolrBatchLoader
uses org.apache.solr.client.solrj.SolrClient
uses org.apache.solr.client.solrj.SolrQuery
uses org.apache.solr.client.solrj.SolrServer
uses org.apache.solr.client.solrj.request.UpdateRequest
uses org.apache.solr.common.SolrDocumentList
uses org.apache.solr.common.params.CommonParams

uses java.io.File

/**
 * Utility for calling APIs on the remote/embedded Solr web application.
 */
@Export
class CCSolrClient {
  
  public static var ACTIVE_INDEX:String = CCSolrUtils.CC_CLAIM_CONTACT_DOCUMENT_TYPE + SolrSearchStore.ACTIVE.suffix()
  public static var ARCHIVE_INDEX:String = CCSolrUtils.CC_CLAIM_CONTACT_DOCUMENT_TYPE + SolrSearchStore.ARCHIVE.suffix()

  var _logger = CCLoggerCategory.APPLICATION

  function getSolrClient(indexName: String) : SolrClient {
    return CCSolrConfig.getSolrClient(indexName)
  }

  @java.lang.Deprecated
  function getSolrServer(indexName: String) : SolrServer {
    return CCSolrConfig.getSolrServer(indexName)
  }

  function getServerStatus(indexName:String) : SolrStatus {
    var solrClient = getSolrClient(indexName)
    var status = new SolrStatus()
    try {
      var response = solrClient.ping()
      status.ServerOK = (response.Status==0)
      //status message
      // status.StatusMessage =
    } catch(e:java.lang.Throwable) {
      status.ServerOK = false
      status.StatusMessage = e.Message
    }
    return status
  }
  
  /**
   * Returns the document count for the given index.
   */
  function getDocumentCount(indexName:String) : int {
    return getCountForQuery(indexName, "*:*")
  }
  
  /**
   * Runs the given query and returns the Solr document results.
   * @param indexName The document index to query
   * @param queryStr The Solr query to execute
   * @return The list of Solr documents
   */
  function query(indexName:String, queryStr:String) : SolrDocumentList {
    return query(indexName, queryStr, {})
  }
  
  /**
   * Runs the given query and returns the Solr document results, restricted
   * by the given limit. The actual number found by the query is retrievable
   * by calling org.apache.solr.common.SolrDocumentList#getNumFound().
   * @param limit The maximum number of documents to return
   * @returns The document list
   */
  function query(indexName:String, queryStr:String, limit:int) : SolrDocumentList {
    var params = new HashMap<String,String>()
    params[CommonParams.ROWS] = String.valueOf(limit)
    return query(indexName, queryStr, params)
  }
  
  /**
   * Runs the given query and returns the XML results.
   * @param indexName The document index to query
   * @param queryStr The Solr query to execute
   * @return The list of Solr documents
   */
  function query(indexName:String, queryStr:String, params:Map<String,String>) : SolrDocumentList {
    var solrClient = getSolrClient(indexName)
    var q = new SolrQuery(queryStr)
    params.eachKeyAndValue( \ k, val -> q.set(k, {val}))
    var response = solrClient.query(q)
    return response.Results
  }

  /**
   * Returns the number of search results for the given query.
   * @param indexName The document index to query
   * @param queryStr The Solr query to execute
   */
  function getCountForQuery(indexName:String, queryStr:String) : int {
    var docList = query(indexName, queryStr, 0)
    return (docList.NumFound as java.lang.Number).intValue()
  }
  
  /**
   * Drops the given index in Solr.
   * @param indexName The name of the index to drop
   * @return true if delete was processed succesfully (status is 0)
   */
  function dropIndex(indexName:String) : boolean {
    var solrClient = getSolrClient(indexName)
    var rq = new UpdateRequest()
    rq.deleteByQuery("*:*")
    var response = rq.process(solrClient)
    return response.Status == 0
  }

  function commit(solrClient : SolrClient) {
    solrClient.commit()
  }

  function commit(indexName:String) {
    commit(getSolrClient(indexName))
  }
  
  /**
   * Drops the given index and re-indexes it from the currently
   * configured database.
   * @param docName The name of the index to re-index
   */
  function bulkLoad(docName:String) : boolean {
    var databaseSuffix = ServerModeUtil.getDbType().toLowerCase()
        .replace("_", "");  // sql_server > sqlserver
    var config = Resources.getSOLR_DOC_CONFIG_FILE(docName + File.separator + "batchload-config-${databaseSuffix}.xml")
    if(not config.exists()) {
      var backupConfig = Resources.getSOLR_DOC_CONFIG_FILE(docName + File.separator + "batchload-config.xml")
      if(not backupConfig.exists()) {
        throw new IllegalArgumentException("Cannot find ${config.AbsolutePath} nor ${backupConfig.AbsolutePath} for document ${docName}")
      } else {
        _logger.warn("Using outdated configuration file ${backupConfig.AbsolutePath} for document ${docName}.")
      }
      config = backupConfig
    }
    try {
      var messageDestName : String
      switch (docName) {
        case CCSolrUtils.CLAIM_DOCUMENTID:
          messageDestName = DisplayKey.get("Java.MessageDestination.SolrMessageTransport.Claim.Name")
          break
        case CCSolrUtils.CLAIM_CONTACT_DOCUMENTID:
          messageDestName = DisplayKey.get("Java.MessageDestination.SolrMessageTransport.ClaimContact.Name")
          break
        default:
          throw new IllegalArgumentException("Unsupported Solr indexing document type: ${docName}")
      }
      GWSolrBatchLoader.performSolrFullImport(config.AbsolutePath, CCSolrConfig.getMessagingDestinationIDFor(messageDestName))
      return true
    } catch(e:java.lang.Exception) {
       _logger.error("Data import for document '${docName}' failed.", e)
       return false
    }
  }
}
