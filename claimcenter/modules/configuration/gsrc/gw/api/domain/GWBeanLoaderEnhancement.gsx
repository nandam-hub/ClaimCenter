package gw.api.domain

uses gw.api.database.PropertyResolver
uses gw.api.database.preload.EffDatedArrayLoader
uses gw.entity.IArrayPropertyInfo
uses java.util.List

enhancement GWBeanLoaderEnhancement : gw.api.domain.BeanLoader {
  @SuppressWarnings("HiddenPackageReference")
  static reified function arrays<P extends KeyableBean, C extends KeyableBean>(parentKeys : List<P>, arrayProp : String) : List<C> {
    if (parentKeys.HasElements) {
      var arrayPropInfo = PropertyResolver.getProperty(parentKeys.first().IntrinsicType, arrayProp) as IArrayPropertyInfo
      if ((arrayPropInfo as com.guidewire.commons.entity.type2.IArrayPropInfoInternal).EffDated) {
        // BeanLoader doesn't work correctly on EffDated beans
        return new EffDatedArrayLoader(arrayPropInfo, parentKeys as List<EffDated>).toList().cast(C)
      }
      return BeanLoader.loadArrays(parentKeys, arrayPropInfo).cast(C)
    }
    return {}
  }
}
