package edge.util.mapping

uses java.lang.ThreadLocal
uses edge.di.annotations.ForAllGwNodes

class EntityCreationContextProvider {
  static private var _context = new ThreadLocal<EntityCreationContext>()

  @ForAllGwNodes
  construct() {}

  property get CurrentContext():EntityCreationContext {
    var ctxt = _context.get()
    if ( ctxt == null ) {
      ctxt = new EntityCreationContext()
      _context.set(ctxt)
    }
    return ctxt
  }

  static function clear() {
    _context.remove()
  }
}
