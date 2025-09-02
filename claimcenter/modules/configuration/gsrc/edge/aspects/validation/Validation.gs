package edge.aspects.validation

uses edge.el.dto.ExpressionDTO
uses edge.el.Expr
uses edge.aspects.validation.dto.VisibilityAndRequirednessRuleDTO
uses edge.aspects.validation.context.ContextAspect
uses gw.api.util.DateUtil
uses java.util.Date

/** Common validation functions and DSL definition. */
final class Validation {
  /** Value access expression. */
  public static final var VALUE : ExpressionDTO = Expr.param(0)

  /** Parent value access expression. */
  public static final var PARENT: ExpressionDTO = Expr.param(1)

  /** Context access expression. */
  public static final var CONTEXT : ExpressionDTO = Expr.param(2)


  /** Simple requiredness factory. */
  public static function requiredWhen(cond : ExpressionDTO, message : ExpressionDTO) : VisibilityAndRequirednessRuleDTO {
    return new VisibilityAndRequirednessRuleDTO(ValidationFunctions.condVisibility(cond, VisibilityAndRequiredness.REQUIRED), message)
  }

  /** Simple requiredness factory. */
  public static function requiredWhen(cond : ExpressionDTO) : VisibilityAndRequirednessRuleDTO {
    return requiredWhen(cond, Expr.translate("Edge.Web.Api.Model.NotNull", {}))
  }

  /** Simple requiredness factory. */
  public static function required(message : ExpressionDTO) : VisibilityAndRequirednessRuleDTO {
    return new VisibilityAndRequirednessRuleDTO(Expr.const<VisibilityAndRequiredness>(VisibilityAndRequiredness.REQUIRED), message)
  }

  /** Convenience method for creating conditional validation expressions.
   * @param when condition which should hold true for validation to be fired.
   * @param validity expression used to evaluate a validity of the property or object.
   * @returns expression which is <code>true</code> if <code>when</code> is <code>false</code> (i.e. rule is not applied
   *   and thus property is valid) or <code>validity</code> is <code>true</code> (i.e. expression is valid).
   */
  public static function conditionally(when : ExpressionDTO, validity : ExpressionDTO) : ExpressionDTO {
    return Expr.any({Expr.isNot(when), validity})
  }

  public static function ignored() : VisibilityAndRequirednessRuleDTO {
    return new VisibilityAndRequirednessRuleDTO(Expr.const<VisibilityAndRequiredness>(VisibilityAndRequiredness.NOT_SET), Expr.translate("Edge.Web.Api.Model.Null", {}))
  }

  /** Simple "Value is ignored when..." factory. */
  public static function ignoredWhen(cond : ExpressionDTO) : VisibilityAndRequirednessRuleDTO {
    return new VisibilityAndRequirednessRuleDTO(ValidationFunctions.condVisibility(cond, VisibilityAndRequiredness.NOT_SET), Expr.translate("Edge.Web.Api.Model.Null", {}))
  }

  /** Inclusive check if int value is between two other values */
  public static function range(start : ExpressionDTO, end : ExpressionDTO, aValue : ExpressionDTO) : ExpressionDTO {
    return Expr.all({
        Expr.greaterThan(aValue, start),
        Expr.lessThan(aValue, end)
    })
  }

  /** Inclusive check if int value is equal to or between two other values */
  public static function rangeInclusive(start : ExpressionDTO, end : ExpressionDTO, aValue : ExpressionDTO) : ExpressionDTO {
    return Expr.all({
        Expr.greaterThanOrEqual(aValue, start),
        Expr.lessThanOrEqual(aValue, end)
    })
  }

  /** Inclusive check if year value is equal to or between a start year and next year */
  public static function yearRangeInclusive(start : ExpressionDTO, aValue : ExpressionDTO) : ExpressionDTO {
    return Expr.all({
        Expr.greaterThanOrEqual(aValue, start),
        Expr.lessOrEqualToNextYear(aValue)
    })
  }

  /** Retrieves a value from the context. */
  public static function getContext(propName : String) : ExpressionDTO {
    return Expr.call(ValidationFunctions#getContextValue(ContextAspect, String), {CONTEXT, propName});
  }

  /** Retrieves a property from the Parent */
  public static function getParentProperty(propName : String) : ExpressionDTO {
    return Expr.getProperty(propName, PARENT);
  }
  
  /** Creates an expression which calculates a length of the string calculated by the expr. */
  public static function strLength(aExpr : ExpressionDTO) : ExpressionDTO {
    return Expr.call(ValidationFunctions#strLength(String), {aExpr})
  }

  /** Creates an expression which calculates a length of the array object calculated by the expr. */
  public static function arrLength(aExpr : ExpressionDTO) : ExpressionDTO {
    return Expr.call(ValidationFunctions#arrLength(Object[]), {aExpr})
  }

  public static class DateExpressions {

    /** Gets returns current date with minutes and seconds set to zero */
    public static function getTimeTrimmedToHour(date: ExpressionDTO) : ExpressionDTO {

      var dateHourValue = Expr.call(DateUtil#getHour(java.util.Date), {date})
      return Expr.call(DateUtil#addHours(java.util.Date, int), {
         date , dateHourValue
      });
    }
  }
}
