package gw.api.inboundfile


/**
 * This batch process will handle all the inbound configurations that are not
 * handled by managed nor specialized batch processes
 */
@Export
class DefaultInboundBatchProcess extends BaseInboundFileBatchProcess {
  construct() {
    super(BatchProcessType.TC_INBOUNDFILEBATCHPROCESS,
        createQuery(\ q -> q.compareNotIn(InboundFileConfig#Name, {
            // list the config names that are handled by separate batch process types
        } )))
  }
}