package edge.el
uses edge.el.dto.ExpressionDTO
uses java.lang.IllegalArgumentException
uses edge.el.dto.NativeCallExpressionDTO
uses gw.lang.reflect.features.MethodReference

/** Post-carbon and other platform-specific enhancements. */
enhancement ExprEnhancement : edge.el.Expr {
  
  /**
   * Creates a "method call" expression for the specific method reference to a native method.
   * Frontend (or other user) should register a method to be available to the execution environment.
   *
   * @param meth method reference. Method must be static and public.
   *
   * @param args expressions to pass as arguments into the method.
   */
  public static function call(meth: MethodReference, args : Object[]) : ExpressionDTO {
    if (!meth.MethodInfo.Static) {
      throw new IllegalArgumentException("Could not call non-static method " + meth.MethodInfo.Name + " on " + meth.MethodInfo.OwnersType.Name)
    }

    if (!meth.MethodInfo.Public) {
      throw new IllegalArgumentException("Could not call non-public method " + meth.MethodInfo.Name + " on " + meth.MethodInfo.OwnersType.Name)
    }

    return new NativeCallExpressionDTO(meth.MethodInfo.OwnersType.Name, meth.MethodInfo.DisplayName, args.map(\arg -> Expr.asExpression(arg)))
  }
}
