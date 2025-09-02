package edge.aspects.validation.annotations

uses edge.metadata.annotation.IMetaFactory
uses edge.el.dto.ExpressionDTO
uses edge.aspects.validation.Validation
uses edge.el.Expr

class Required implements IMetaFactory {

  private var _when : ExpressionDTO as When
  private var _msgExp : ExpressionDTO

  construct() {
    this("Edge.Web.Api.Model.NotNull")
  }

  construct(w : ExpressionDTO) {
    this(w,"Edge.Web.Api.Model.NotNull")
  }

  construct(w : ExpressionDTO, msgKey:String) {
    this._when = w
    this._msgExp = Expr.translate(msgKey, {})
  }

  construct(msgKey:String) {
    this._msgExp = Expr.translate(msgKey, {})
  }

  override function getState(): Object {
    return _when == null ? Validation.required(_msgExp) : Validation.requiredWhen(_when, _msgExp);
  }
}
