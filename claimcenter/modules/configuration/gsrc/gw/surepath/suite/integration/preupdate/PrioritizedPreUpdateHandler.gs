package gw.surepath.suite.integration.preupdate

/**
 * Interface which allows prioritized execution per Inserted, Updated, and/or Removed Beans during PreUpdate handling
 *
 * @param <T> The Entity Type that will be used in the executePreUpdate
 */
interface PrioritizedPreUpdateHandler<T extends KeyableBean> {

  /**
   * Priority used to determine execution ordering
   *
   * @return - The Priority Enum
   */
  property get Priority() : PreUpdatePriority

  /**
   * boolean determining if the executePreUpdate handler should be passed Inserted Beans
   * @return - True if the executePreUpdate will handle Inserted Beans
   */
  property get Inserted() : boolean {
    return false
  }

  /**
   * boolean determining if the executePreUpdate handler should be passed Updated Beans
   * @return - True if the executePreUpdate will handle Updated Beans
   */
  property get Updated() : boolean {
    return false
  }

  /**
   * boolean determining if the executePreUpdate handler should be passed Removed Beans
   * @return - True if the executePreUpdate will handle Removed Beans
   */
  property get Removed() : boolean {
    return false
  }

  /**
   * Function called during the SurePathPreUpdateHandler execution
   * @param beans - The relevant beans of Type<T>
   */
  public function executePreUpdate(final beans : List<T>)
}