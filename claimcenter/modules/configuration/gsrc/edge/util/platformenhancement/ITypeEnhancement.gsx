package edge.util.platformenhancement

enhancement ITypeEnhancement : gw.lang.reflect.IType {
  property get QName() : String {
    if (this.Primitive || this.Namespace == null || this.Namespace.Empty) {
      return this.Name
    }
    
    return this.Namespace + "." + this.RelativeName
  }
}
