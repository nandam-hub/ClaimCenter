package gw.solr.utils

uses gw.api.database.Query
uses gw.api.database.Relop
uses gw.plugin.solr.SolrSearchStore
uses gw.solr.ReindexEntitiesInSolr


/**
 * Utility class for working with Solr search.
 */
@Export
class CCSolrUtils extends PLSolrUtils {

  /**
   * Application ID for ClaimCenter
   */
  public static final var APPID : String = "cc"

  /**
   * Solr core prefix
   */
  public static final var CC_CORE_PREFIX : String = APPID + "-gwsolr"

  // You should have one documentId and one documentType declared for each document type. The documentType should be of the
  // form <appId>_<documentId>, for example, cc_claimContact.

  /**
   * Document ID for claim contact documents
   */
  public static final var CLAIM_CONTACT_DOCUMENTID : String = "claimcontact"

  /**
   * Document type identifier string for claim contact
   */
  public static final var CC_CLAIM_CONTACT_DOCUMENT_TYPE : String = APPID + "_" + CLAIM_CONTACT_DOCUMENTID


  public final static var CC_CLAIM_CONTACT_ACTIVE_DOCUMENT_TYPE : String = CC_CLAIM_CONTACT_DOCUMENT_TYPE + SolrSearchStore.ACTIVE.suffix()

  public final static var CC_CLAIM_CONTACT_ARCHIVE_DOCUMENT_TYPE : String = CC_CLAIM_CONTACT_DOCUMENT_TYPE + SolrSearchStore.ARCHIVE.suffix()

  /**
   * Document index for archived claim contact.
   */
  public static final var CC_CLAIM_CONTACT_ARCHIVE : String = CC_CLAIM_CONTACT_DOCUMENT_TYPE + SolrSearchStore.ARCHIVE.suffix()

  /**
   * Document ID for claim documents
   */
  public static final var CLAIM_DOCUMENTID : String = "claim"

  /**
   * Document type identifier string for claim
   */
  public static final var CC_CLAIM_DOCUMENT_TYPE : String = APPID + "_" + CLAIM_DOCUMENTID

  public final static var CC_CLAIM_ACTIVE_DOCUMENT_TYPE : String = CC_CLAIM_DOCUMENT_TYPE + SolrSearchStore.ACTIVE.suffix()

  public final static var CC_CLAIM_ARCHIVE_DOCUMENT_TYPE : String = CC_CLAIM_DOCUMENT_TYPE + SolrSearchStore.ARCHIVE.suffix()

  public static final var CC_CLAIM_DELIMITER : String = "|"

  public static function dropArchivedClaimIndex() {
    var solrClient = new CCSolrClient()
    solrClient.dropIndex(CC_CLAIM_ARCHIVE_DOCUMENT_TYPE)
  }

  public static function reindexArchivedClaim() {
    if (getReIndexingArchivedClaimCount() == 0) {
      new ReindexEntitiesInSolr().run()
    }
  }

  public static function getReIndexingArchivedClaimCount() : int {
    var query = Query.make(ClaimInfo)
        .compare(ClaimInfo#ArchiveState, Relop.Equals, ArchiveState.TC_ARCHIVED)
        .compare(ClaimInfo#PendingReindex, Relop.Equals, true)
        .select()
    return query.Count
  }
}