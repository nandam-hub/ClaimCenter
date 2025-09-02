package edge.PlatformSupport

public class Arrays {

  static reified function lambdaWhere<T>( mtArray:T[], cond(elt:T): boolean ) : T[] {
    return mtArray?.where( cond )
  }  

  static function lambdaFirstWhere<T>( mtArray:T[], cond(elt:T): boolean ) : T {
      return mtArray?.firstWhere( cond )
  }

  static function hasElements<T>(mtArray:T[]) : boolean {
    return (mtArray != null && mtArray.length > 0) ? true : false
  }
}
