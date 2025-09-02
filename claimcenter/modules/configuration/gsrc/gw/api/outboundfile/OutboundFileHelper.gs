package gw.api.outboundfile

uses org.jetbrains.annotations.NotNull

/**
 * This class has customer editable helper methods used in the UI
 *
 */
@Export
class OutboundFileHelper {

  /**
   * This is just a thin wrapper to call {@link OutboundFileHandler#canView(entity.OutboundRecord)}
   *
   * @param record the bean from the UI
   * @return whether they can view
   */
  static function canView(@NotNull record : OutboundRecord) : boolean {
    var handler = HandlerCache.Instance.get(record.Config)
    if (handler == null) {
      return false
    }
    return handler.canView(record)
  }

  /**
   * This is just a thin wrapper to call {@link OutboundFileHandler#canEdit(entity.OutboundRecord)}
   *
   * @param record the bean
   * @return whether they can edit
   */
  static function canEdit(@NotNull record : OutboundRecord) : boolean {
    var handler = HandlerCache.Instance.get(record.Config)
    if (handler == null) {
      return false
    }
    return handler.canEdit(record)
  }
}