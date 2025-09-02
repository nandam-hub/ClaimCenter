package gw.api.database.preload

uses gw.entity.IArrayPropertyInfo

enhancement GWEffDatedIterableEnhancement<P extends  EffDated> : Iterable<P> {

  /**
   * Bulk loads all the {@link EffDated} children of the specified {@link IArrayPropertyInfo} for this {@link EffDated} {@link Iterable}.
   *
   * @param arrayProp the effective dated array relationship.
   * @param <C> type of the children
   * @return the {@link Iterable} of all the children of this {@link Iterable} having the array relationship.
   */
  function arrays<C extends EffDated>(arrayProp : IArrayPropertyInfo) : Iterable<C> {
    return new EffDatedArrayLoader<P, C>(arrayProp, this)
  }
}
