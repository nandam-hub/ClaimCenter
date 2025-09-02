package edge.el.typing

uses gw.lang.reflect.IType

/**
 * Information about expression type. At this moment it is just an alias to the type, but could be extended in the
 * future.
 */
final class ExpressionType {
  /** Gosu type of the expression. Null if type is dynamic. */
  private var _gosuType : IType as GosuType


  construct(gt : IType) {
    this._gosuType = gt
  }
}
