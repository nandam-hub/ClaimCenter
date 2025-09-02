package gw.solr

uses gw.api.solr.CCSolrConfig
uses gw.api.system.PLLoggerCategory
uses gw.cc.config.Resources
uses gw.plugin.management.SolrMessageMonitor
uses gw.plugin.solr.CCFreeTextSearchUtil
uses gw.plugin.solr.SolrSearchStore
uses gw.solr.request.ClaimContactSolrRequestFactory
uses gw.solr.utils.CCSolrUtils
uses gw.solr.utils.SolrUpdateMessage
uses org.json.simple.JSONArray

/**
 * External Solr search indexing of claim contact.
 */
@Export
class CCClaimContactSolrMessageTransportPlugin extends AbstractSolrMessageTransportPlugin {

  construct() {
    this("CCClaimContactSolrMessageTransportPlugin")
  }

  protected construct(pluginName : String) {
    super(pluginName, new CCDocumentReconstructor())
  }

  // ------------------------------------------------------------------
  // Event message interpretation, runs on server node performing transaction
  // ------------------------------------------------------------------

  override function send(message : Message, data : String) {
    if (_logger.TraceEnabled) _logger.trace(PluginName + ".send() : " + data)
    try {
      var solrMsg = SolrUpdateMessage.parse(data)
      var updateRequest = ConsistencyTracker.maybeCorrectMessage(solrMsg.JsonPayload)
      var response = updateRequest?.process(CCSolrConfig.getSolrClient(solrMsg.DocType))
      SolrMessageMonitor.Instance.incrementTotalSends()

      if (PLLoggerCategory.SOLR_INDEX.TraceEnabled)
        PLLoggerCategory.SOLR_INDEX.trace("Solr update response: " + response)
      if (response != null && response.Status != 0) {
        SolrMessageMonitor.Instance.incrementTotalSendErrors()
        throw new SolrException("Solr update request " + updateRequest.XML +
            " for " + solrMsg.DocType + " failed with status code " + response.Status)
      }
    } catch (e : Exception) {
      // If the _debug flag is set, no exception will be thrown and the code will fall thru to
      // message.reportAck() below. This is useful behavior when debugging since you don't have
      // to keep resuming the message destination.  However, it will also have the side effect
      // of causing the Lucene index to get out of sync with the app database.
      if (!Debug) {
        throw e
      } else {
        _logger.error("", e)
      }
    }
    message.reportAck()
  }

  override property set Parameters(params : Map<Object, Object>) {
    super.Parameters = params
    var consistencyCacheSize = params.get(CONSISTENCY_CACHE_SIZE_PARAM)
    if(consistencyCacheSize != null) {
      _consistencyCacheSize.set(consistencyCacheSize as int)
    }
    var consistencyCacheExpirationSeconds = params.get(CONSISTENCY_CACHE_EXPIRATION_SECONDS_PARAM)
    if(consistencyCacheExpirationSeconds != null) {
      _consistencyCacheExpirationSeconds.set(consistencyCacheExpirationSeconds as int)
    }
  }

  public static function handleClaimAddedEvent(messageContext : MessageContext) {
    var claim = messageContext.Root as Claim
    createMessages(messageContext, ClaimContactSolrRequestFactory.createClaimIndexRequest(claim))
  }

  public static function handleClaimChangedEvent(messageContext : MessageContext) {
    var claim = messageContext.Root as Claim
    for(ctct in claim.Contacts) {
      if(hasRelevantChanges(ctct, Resources.CLAIMCONTACT_SEARCH_CONFIG)) {
        createMessages(messageContext, ClaimContactSolrRequestFactory.createClaimIndexRequest(claim))
        break
      }
    }
  }

  public static function handleClaimRemovedEvent(messageContext : MessageContext) {
    createMessages(messageContext, ClaimContactSolrRequestFactory.createClaimDeleteRequest(messageContext.Root as Claim))
  }

  public static function handleClaimPurgedEvent(messageContext : MessageContext) {
    var c = messageContext.Root
    if (c typeis Claim) {
      createMessages(messageContext, ClaimContactSolrRequestFactory.createClaimDeleteByClaimNumberRequest(c.ClaimNumber, SolrSearchStore.ACTIVE))
    } else if (c typeis ClaimInfo) {
      createMessages(messageContext, ClaimContactSolrRequestFactory.createClaimDeleteByClaimNumberRequest(c.ClaimNumber, SolrSearchStore.ARCHIVE))
    }
  }

  public static function handleClaimInfoChangedEvent(messageContext : MessageContext) {
    var claimInfo = messageContext.Root as ClaimInfo
    if (claimInfo.ExcludeReason != null && claimInfo.ExcludeReason != "null") {
      if(_logger.TraceEnabled) _logger.trace("ClaimInfoChanged for ${claimInfo.ClaimNumber} ignored.  Exclude reason = ${claimInfo.ExcludeReason}")
      return
    }
    if (claimInfo.ArchiveState == ArchiveState.TC_ARCHIVED)  {
      if(_logger.TraceEnabled) _logger.trace("Archiving contacts in claim: ${claimInfo.ClaimNumber}")
      var docArray = CCFreeTextSearchUtil.getSolrSearchPlugin().searchByClaimNumber(claimInfo.ClaimNumber, CCSolrUtils.CC_CLAIM_CONTACT_ACTIVE_DOCUMENT_TYPE) as JSONArray
      createMessages(messageContext, ClaimContactSolrRequestFactory.createClaimArchiveIndexRequest(docArray, SolrSearchStore.ARCHIVE))
      createMessages(messageContext, ClaimContactSolrRequestFactory.createClaimDeleteByClaimNumberRequest(claimInfo.ClaimNumber, SolrSearchStore.ACTIVE))
    } else if (claimInfo.ArchiveState == null && claimInfo.ChangedFields.contains("ArchiveState")) {
      if(_logger.TraceEnabled) _logger.trace("Restoring contacts in claim: ${claimInfo.ClaimNumber}")
      var docArray = CCFreeTextSearchUtil.getSolrSearchPlugin().searchByClaimNumber(claimInfo.ClaimNumber, CCSolrUtils.CC_CLAIM_CONTACT_ARCHIVE_DOCUMENT_TYPE) as JSONArray
      createMessages(messageContext, ClaimContactSolrRequestFactory.createClaimArchiveIndexRequest(docArray, SolrSearchStore.ACTIVE))
      createMessages(messageContext, ClaimContactSolrRequestFactory.createClaimDeleteByClaimNumberRequest(claimInfo.ClaimNumber, SolrSearchStore.ARCHIVE))
    }
  }

  public static function handleClaimContactAddedEvent(messageContext : MessageContext) {
    var claimContact = messageContext.Root as ClaimContact
    if (!claimContact.Claim.New) {
      createMessages(messageContext, ClaimContactSolrRequestFactory.createClaimIndexRequest(claimContact))
    } // else no need to do anything since the document will be sent out as a result of the ClaimAdded event
  }

  public static function handleClaimContactChangedEvent(messageContext : MessageContext) {
    var claimContact = messageContext.Root as ClaimContact
    if (!claimContact.Claim.Changed) {
      createMessages(messageContext, ClaimContactSolrRequestFactory.createClaimIndexRequest(claimContact))
    }
  }

  public static function handleClaimContactContactChangedEvent(messageContext : MessageContext) {
    var claimContact = messageContext.Root as ClaimContact
    if (!claimContact.Claim.Changed) {
      createMessages(messageContext, ClaimContactSolrRequestFactory.createClaimIndexRequest(claimContact))
    }
  }

  public static function handleClaimContactRemovedEvent(messageContext : MessageContext) {
    var claimContact = messageContext.Root as ClaimContact
    createMessages(messageContext, ClaimContactSolrRequestFactory.createClaimDeleteRequest(claimContact))
  }

  public static function handleClaimContactRoleAddedEvent(messageContext : MessageContext) {
    var claimContactRole = messageContext.Root as ClaimContactRole
    var claimContact = claimContactRole.ClaimContact
    if (!claimContact.New) {
      createMessages(messageContext, ClaimContactSolrRequestFactory.createClaimIndexRequest(claimContact))
    } // else no need to do anything here since the document will be sent out as a result of the ClaimContactAdded event being handled.
  }

  public static function handleClaimContactRoleChangedEvent(messageContext : MessageContext) {
    var claimContactRole = messageContext.Root as ClaimContactRole
    createMessages(messageContext, ClaimContactSolrRequestFactory.createClaimIndexRequest(claimContactRole.ClaimContact))
  }

  // This method is a special case since it doesn't return a DeleteRequest object, but an IndexRequest object
  // This is because what is required is that all ClaimContactAddress records get written out again with a new set of roles.
  public static function handleClaimContactRoleRemovedEvent(messageContext : MessageContext)  {
    var claimContactRole = messageContext.Root as ClaimContactRole
    var claimContact = claimContactRole.ClaimContact
    for (var bean in claimContactRole.Bundle.RemovedBeans) {
      if (bean typeis ClaimContact and bean.PublicID == claimContact.PublicID) {
        return
      }
    }
    createMessages(messageContext, ClaimContactSolrRequestFactory.createClaimIndexRequest(claimContact))
  }
}
