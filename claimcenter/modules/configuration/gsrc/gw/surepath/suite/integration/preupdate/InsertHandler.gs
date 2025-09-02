package gw.surepath.suite.integration.preupdate

/**
 * Interface used to mark a PrioritizedPreUpdateHandler to listen for Inserted beans of type <T>
 *
 * @param <T> The Entity Type that will be used in the executePreUpdate
 */
interface InsertHandler<T extends KeyableBean> extends PrioritizedPreUpdateHandler<T> {
  override property get Inserted(): boolean { return true }
}