package gw.surepath.cc.configuration.timeline.creation

uses gw.surepath.suite.configuration.annotation.IncludeInDocumentation

/**
 * Interface referenced from TimelineLink_SP entity
 */
@IncludeInDocumentation
interface TimelineLinkInterface {

  /** Returns the bean of which this entity links to. */
  @IncludeInDocumentation
  public function load() : KeyableBean

  /** Sets this link to the KeyableBean B.
   * @param b - The bean this link returns.
   */
  @IncludeInDocumentation
  public property set Bean(b : KeyableBean)

  /** This is called during the BundleTransactionCallback to
   *  set the BeanID and BeanType of the TimelineLink.
   *  This function should be called at some point after
   *  setBean has set the bean which this link returns.
   */
  @IncludeInDocumentation
  public function setConnection()
}
