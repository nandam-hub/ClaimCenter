package edge.aspects.validation.annotations

uses edge.el.dto.ExpressionDTO
uses edge.metadata.annotation.IMetaFactory
uses edge.aspects.validation.dto.ContextDTO
uses edge.el.Expr

final class Context implements IMetaFactory {

  /** Expression to access field/object value in the context expression. */
  public static final var VALUE : ExpressionDTO = Expr.param(0)

  /** Expression to access field's parent value in the context expression. Use of this parameter is discouraged as
   * this mean that context value belongs to parent rather than to a place where it is defined now.
   */
  public static final var PARENT : ExpressionDTO = Expr.param(1)

  /** Name of the property to define. */
  private var _name : String as Name

  /** Expression used to evaluate a context. */
  private var _expr : ExpressionDTO as Expression

  construct(n : String, expr : ExpressionDTO) {
    this._name = n
    this._expr = expr
  }

  override public function getState() : ContextDTO {
    return new ContextDTO(){:Name = this._name, :Expression = this._expr};
  }
}
