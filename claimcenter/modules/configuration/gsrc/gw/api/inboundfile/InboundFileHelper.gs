package gw.api.inboundfile

/**
 * This is an editable helper class that is used in UI to restrict view/edit permissions on
 * content of inbound file records or subrecords.
 */
@Export
class InboundFileHelper {

  /**
   * The UI accesses these values with just a keyable bean, os this method determines
   * the type of the bean and calls the handler {@link InboundFileHandler#canView(entity.InboundRecord, entity.InboundSubRecord)}
   *
   * @param bean the bean from the UI
   * @return whether they can view
   */
  static function canView(bean : KeyableBean) : boolean {
    var handler = HandlerCache.Instance.get(resolveConfig(bean))
    if (handler == null) {
      return false
    }
    if (bean typeis InboundSubRecordView) {
      return handler.canView(bean.InboundRecord, bean.InboundSubRecord)
    } else if (bean typeis InboundSubRecord) {
      return handler.canView(bean.InboundRecord, bean)
    } else if (bean typeis InboundRecordView) {
      return handler.canView(bean.InboundRecord, null)
    } else if (bean typeis InboundRecord) {
      return handler.canView(bean, null)
    }
    return false
  }

  /**
   * Whether the current user can edit the content
   *
   * @param bean the bean
   * @return whether they can edit
   */
  static function canEdit(bean : KeyableBean) : boolean {
    var handler = HandlerCache.Instance.get(resolveConfig(bean))
    if (handler == null) {
      return false
    }
    if (bean typeis InboundSubRecordView) {
      return handler.canEdit(bean.InboundRecord, bean.InboundSubRecord)
    } else if (bean typeis InboundSubRecord) {
      return handler.canEdit(bean.InboundRecord, bean)
    } else if (bean typeis InboundRecordView) {
      return handler.canEdit(bean.InboundRecord, null)
    } else if (bean typeis InboundRecord) {
      return handler.canEdit(bean, null)
    }
    return false
  }

  private static function resolveConfig(bean : KeyableBean) : String {
    var config : String
    if (bean typeis InboundSubRecordView) {
      config = bean.InboundRecord.Config
    } else if (bean typeis InboundSubRecord) {
      config = bean.InboundRecord.Config
    } else if (bean typeis InboundRecordView) {
      config = bean.Config
    } else if (bean typeis InboundRecord) {
      config = bean.Config
    }
    return config;
  }
}