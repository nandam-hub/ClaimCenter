package edge.aspects.validation

uses edge.el.dto.ExpressionDTO
uses edge.el.Expr
uses gw.entity.TypeKey
uses gw.entity.ITypeList
uses edge.aspects.validation.context.ContextAspect
uses edge.el.DynamicValue
uses java.util.HashMap
uses java.util.Date
uses java.lang.Math
uses java.math.BigDecimal
uses gw.api.util.CurrencyUtil

/** Additional validation functions (used by Expression language and validation implementation). */
final class ValidationFunctions {


  /** Creates a conditional visibility rule. */
  internal static function condVisibility(cond : ExpressionDTO, target : VisibilityAndRequiredness) : ExpressionDTO {
    return Expr.call(#optionalVisibility(Boolean, edge.aspects.validation.VisibilityAndRequiredness),
        {cond, Expr.const<VisibilityAndRequiredness>(target)})
  }

  /** Factory (utility) for the optional visibility. */
  public static function optionalVisibility(cond : Boolean, vis : VisibilityAndRequiredness) : VisibilityAndRequiredness {
    return cond ? vis : VisibilityAndRequiredness.OPTIONAL
  }


  /**
   * Checks if a value belongs to the specific typelist filter.
   */
  public static function belongsToFilter(x : TypeKey, filterName : String) : boolean {
    return ((typeof x) as ITypeList).getTypeKeysByFilterName(filterName).contains(x)
  }

  /** Checks that <code>item</code> belongs to parent's category.  */
  public static function hasCategory(item : TypeKey, parent : TypeKey) : boolean {
    return item.hasCategory(parent)
  }

  /** Returns a value from the context. */
  @DynamicValue
  public static function getContextValue(ctx : ContextAspect, prop : String) : Object {
    return ctx.get(prop);
  }

  /**
   * Checks if a string matches a given pattern.
   */
  public static function matchesPattern(pattern:String, value:String) : boolean {
    return pattern.HasContent && value.HasContent ? value.matches(pattern)  : true
  }

  /**
   * Checks that a currency value is accurate in scale for a region. Default validation is performed against USD - to be
   * extended if working with multicurrency environments.
  */
  public static function isCurrency(value:Object) : boolean{
    if (!(value typeis BigDecimal)) {
      return false
    } else {
      var decimalValue = value as BigDecimal
      return decimalValue.scale() > CurrencyUtil.getStorageScale(CurrencyUtil.getDefaultCurrency()) ? false : true
    }
  }

  /**
   * Checks if a value is within a range of integers
   */
  public static function range(start:int, end:int, value: int) : boolean {
    return value >= start && value <= end
  }

  /**
   * Checks if a value is within a range of BigDecimal
   */
  public static function decimalRange(start:BigDecimal, end:BigDecimal, value: BigDecimal) : boolean {
    return value >= start && value <= end
  }

  /**
   * Compares two dates.
   *
   * @returns 0 if both dates are equal
   *          < 0 if d1 < d2
   *          > 0 if d2 > d1
   */
  public static function compareDate(d1:Date, d2:Date):int {
    var dif = d1.getTime() - d2.getTime()
    return dif == 0 ? 0 : dif > 0 ? 1 : -1
  }
  
  @DynamicValue
  public static function getFromMap(map:HashMap<Object,Object>, key : Object) : Object {
    return map.get(key)
  }

  public static function strLength(str : String) : int {
    return str == null ? 0 : str.length
  }

  public static function arrLength(arr : Object[]) : int {
    return arr == null ? 0 : arr.length
  }

  /** Checks that typekey is in a list of typekeys. Due to Wizard/EL constant restriction, it is not safe to
   * use a generic function for the typekey comparison on the frontend.
   */
  public static function typekeyIn(key : TypeKey, values : TypeKey[]) : boolean {
    return values.contains(key);
  }

  public static function isEmpty(str:String):boolean {
    return !str.HasContent
  }

}
