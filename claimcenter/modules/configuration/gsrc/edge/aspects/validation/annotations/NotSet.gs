package edge.aspects.validation.annotations

uses edge.metadata.annotation.IMetaFactory
uses edge.el.dto.ExpressionDTO
uses edge.aspects.validation.Validation
uses java.lang.IllegalStateException
uses edge.el.Expr

/**
* This annotation indicates that a value should not be provided
* when the condition is m
 */
class NotSet implements IMetaFactory {

  private var _when : ExpressionDTO as When

  construct() {
    this(Expr.const(true))
  }

  construct(w : ExpressionDTO) {
    this._when = w
  }

  override function getState(): Object {
    if (_when == null) {
      throw new IllegalStateException("Condtition should be set for the 'NotSet' rule")
    }
    return Validation.ignoredWhen(_when);
  }
}
