package gw.api.outboundfile


/**
 * This batch process will handle all the inbound configurations that are not
 * handled by managed nor specialized batch processes
 */
@Export
class DefaultOutboundBatchProcess extends BaseOutboundFileBatchProcess {
  construct() {
    super(BatchProcessType.TC_OUTBOUNDFILEBATCHPROCESS,
        createQuery(\ q -> q.compareNotIn(OutboundFileConfig#Name, {
            // list the config names that are handled by separate batch process types
        } )))
  }
}