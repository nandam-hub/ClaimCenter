package gw.solr

uses com.guidewire.pl.system.archive.ArchivingUtil
uses gw.api.solr.CCSolrConfig
uses gw.api.system.PLLoggerCategory
uses gw.plugin.management.SolrMessageMonitor
uses gw.solr.request.ClaimSolrRequestFactory
uses gw.solr.utils.SolrUpdateMessage

/**
 * External Solr search indexing of claim.
 */
@Export
class CCClaimSolrMessageTransportPlugin extends AbstractSolrMessageTransportPlugin {

  construct() {
    this("CCClaimSolrMessageTransportPlugin")
  }

  protected construct(pluginName : String) {
    super(pluginName, new CCClaimDocumentReconstructor())
  }

  // ------------------------------------------------------------------
  // Event message interpretation, runs on server node performing transaction
  // ------------------------------------------------------------------

  override function send(message : Message, data : String) {
    if(_logger.TraceEnabled) _logger.trace(PluginName + ".send() : " + data)
    try {
      var solrMsg = SolrUpdateMessage.parse(data)
      var updateRequest = ConsistencyTracker.maybeCorrectMessage(solrMsg.JsonPayload)
      var response = updateRequest?.process(CCSolrConfig.getSolrClient(solrMsg.DocType))
      SolrMessageMonitor.Instance.incrementTotalSends()

      if(PLLoggerCategory.SOLR_INDEX.TraceEnabled) PLLoggerCategory.SOLR_INDEX.trace("Solr update response: " + response)
      if(response != null && response.Status != 0) {
        SolrMessageMonitor.Instance.incrementTotalSendErrors()
        throw new SolrException("Solr update request " + updateRequest.XML +
            " for " + solrMsg.DocType + " failed with status code " + response.Status)
      }
      // If the message is for "ClaimInfoChanged", reset the re-index flag of ClaimInfo back to FALSE whenever it is TRUE
      if (message.EventName.equals("ClaimInfoChanged")) {
        var claimInfo = message.MessageRoot as ClaimInfo
        if (claimInfo.PendingReindex) {
          claimInfo.setPendingReindex(false)
        }
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

  public static function handleClaimPurgedEvent(messageContext : MessageContext) {
    var c = messageContext.Root
    if (c typeis ClaimInfo) {
      createMessages(messageContext, ClaimSolrRequestFactory.createClaimDeleteByRootPublicIDRequest(getRootPublicID(c)))
    }
  }

  public static function handleClaimInfoChangedEvent(messageContext : MessageContext) {
    var claimInfo = messageContext.Root as ClaimInfo

    if (claimInfo.ExcludeReason != null && claimInfo.ExcludeReason != "null") {
      if(_logger.TraceEnabled) _logger.trace("ClaimInfoChanged for ${claimInfo.ClaimNumber} ignored.  Exclude reason = ${claimInfo.ExcludeReason}")
      return
    }
    if (claimInfo.ArchiveState == ArchiveState.TC_ARCHIVED)  {
      var claim = ArchivingUtil.loadArchivedEntity(claimInfo) as Claim
      if(_logger.TraceEnabled) _logger.trace("Archiving claim: ${claimInfo.ClaimNumber}")
      // create message for archived claim
      if (!claimInfo.isFieldChanged("PendingReindex") || (claimInfo.isFieldChanged("PendingReindex") && claimInfo.PendingReindex)) {
        createMessages(messageContext, ClaimSolrRequestFactory.createClaimArchiveIndexRequest(claim))
      }
    } else if (claimInfo.ArchiveState == null && claimInfo.ChangedFields.contains("ArchiveState")) {
      if(_logger.TraceEnabled) _logger.trace("Restoring claim: ${claimInfo.ClaimNumber}")
      // remove message for restored claim
      createMessages(messageContext, ClaimSolrRequestFactory.createClaimDeleteByRootPublicIDRequest(getRootPublicID(claimInfo)))
    }
  }

  private static function getRootPublicID(claimInfo : ClaimInfo) : String {
    return "claimPublicID=" + claimInfo.RootPublicID.replace(":", "\\:")
  }

}
