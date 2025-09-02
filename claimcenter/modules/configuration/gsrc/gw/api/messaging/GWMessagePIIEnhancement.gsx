package gw.api.messaging

uses gw.api.system.PLLoggerCategory
uses gw.api.system.server.ServerUtil

/**
 * This enhancement provides a mechanism so that customer can indicate whether the message payload
 * contains PII or other sensitive information which should not be viewable or editable. In general, it is data safe to
 * view data (although it might violate policies about personal information), and potentially unsafe to edit payload
 * content.
 * <p>
 * IMPLEMENTOR NOTE:  The Message is available as {@link #this} and the current user {@link User.util.CurrentUser}
 * This is processed for all Messages so if there is might be destinations that have no PII and would be okay to
 * see the payload.
 */
@SuppressWarnings("unused")
enhancement GWMessagePIIEnhancement : Message {

  /**
   * Whether the current end user has permission to view the payload content.
   *
   * @return true if user can view
   */
  function canView() : boolean {
    var dest = this.DestinationID
    var user = User.util.CurrentUser
    return ServerUtil.LowerPlanet || PLLoggerCategory.MESSAGING_PII.DebugEnabled
  }

  /**
   * Whether the current end user has permission to edit the payload content.
   *
   * @return true if user can edit
   */
  function canEdit() : boolean {
    var dest = this.DestinationID
    var user = User.util.CurrentUser
    return ServerUtil.LowerPlanet
  }

}
