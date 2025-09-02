package edge.PlatformSupport

/**
 * Provides platform level abstractions.
 */
final class Bundle {
  private var _bundle: gw.pl.persistence.core.Bundle as PlatformBundle
  construct(bundle: gw.pl.persistence.core.Bundle) {
    _bundle = bundle
  }

  public static function getCurrent(): Bundle{
    return new Bundle(gw.transaction.Transaction.getCurrent())
  }


  public function add<T extends entity.KeyableBean>(t: T): T {
    return _bundle.add(t)
  }

  public function delete(keyableBean: entity.KeyableBean): void {
    _bundle.delete(keyableBean)
  }

  public function loadBean(key: gw.pl.persistence.core.Key): entity.KeyableBean {
    return _bundle.loadBean(key)
  }

  public property get InsertedBeans():java.util.Collection<entity.KeyableBean> {
    return _bundle.InsertedBeans
  }

  public property get UpdatedBeans(): java.util.Collection<entity.KeyableBean> {
    return _bundle.UpdatedBeans
  }

  public property get RemovedBeans(): java.util.Collection<entity.KeyableBean> {
    return _bundle.RemovedBeans
  }

  public function getBeansByRootType(iEntityType: gw.entity.IEntityType): java.util.Collection<entity.KeyableBean> {
    return _bundle.getBeansByRootType(iEntityType)
  }

  /*
   * -----
   * API for transaction handling.
   * -----
  */

  /*--- TRANSACTIONS WITH RESULT ---*/

  /**
   * Runs the specified block using a new bundle
   * and returns result of the evaluation.
   */
  public static function resolveInTransaction<T>(cb(bundle: Bundle): T): T {
    var res: T = null
    gw.transaction.Transaction.runWithNewBundle(\bundle -> {
      res = cb(new Bundle(bundle))
    })
    return res
  }

  /**
   * Runs the specified block using a new bundle with the given user set as the active user
   * and returns result of the evaluation.
   */
  public static function resolveInTransaction<T>(cb(bundle: Bundle): T, user: User): T {
    var res: T = null
    gw.transaction.Transaction.runWithNewBundle(\bundle -> {
      res = cb(new Bundle(bundle))
    }, user)
    return res
  }

  /**
   * Runs the specified block using a new bundle with the user identified by the given username set as the active user
   * and returns result of the evaluation.
   */
  public static function resolveInTransaction<T>(cb(bundle: Bundle): T, username: String): T {
    var res: T = null
    gw.transaction.Transaction.runWithNewBundle(\bundle -> {
      res = cb(new Bundle(bundle))
    }, username)
    return res
  }


  /*--- TRANSACTIONS WITHOUT RESULT ---*/


  /**
   * Runs the specified block using a new bundle.
   */
  public static function transaction(cb(bundle: Bundle)): void {
    gw.transaction.Transaction.runWithNewBundle(\bundle -> {
      cb(new Bundle(bundle))
    })
  }

  /**
   * Runs the specified block using a new bundle with the given user set as the active user.
  */
  public static function transaction(cb(bundle: Bundle), user : User): void {
    gw.transaction.Transaction.runWithNewBundle(\bundle -> {
      cb(new Bundle(bundle))
    }, user)
  }

  /**
   * Runs the specified block using a new bundle with the user identified by the given username set as the active user.
  */
  public static function transaction(cb(bundle: Bundle), username : String): void {
    gw.transaction.Transaction.runWithNewBundle(\bundle -> {
      cb(new Bundle(bundle))
    }, username)
  }



}
