package edge.aspects.validation.annotations

uses gw.api.address.AddressOwnerFieldId
uses java.util.Set
uses gw.api.address.AddressCountrySettings
uses edge.PlatformSupport.Locale
uses edge.metadata.annotation.IPropertyAwareMetaMultiFactory
uses gw.lang.reflect.IPropertyInfo
uses edge.aspects.validation.dto.VisibilityAndRequirednessRuleDTO
uses edge.el.Expr
uses edge.aspects.validation.VisibilityAndRequiredness
uses java.lang.IllegalStateException

/**
 * This annotation generates field visibility restrictions based on the locale settings.
 * For example it validates that a kanji value is not provided when the locale is not Japanese
 */
class AddressField implements IPropertyAwareMetaMultiFactory {

  private static final var VISIBLE_FIELDS : Set<AddressOwnerFieldId> = AddressCountrySettings.getSettings(Locale.DefaultCountry).VisibleFields

  var _addressField : AddressOwnerFieldId

  construct() { }

  /** Builds a metadata for the field based on the specific contact field. This is useful for cases where
   * DTO property name does not match an address field name.
   */
  construct(af: AddressOwnerFieldId) {
    this._addressField = af
  }

  override function getState(prop: IPropertyInfo): Object[] {
    final var field = getAddressFieldIdName(prop)
    final var visible = VISIBLE_FIELDS.contains(field)
    if (!visible) {
      return {
          new VisibilityAndRequirednessRuleDTO(
              Expr.const<VisibilityAndRequiredness>(VisibilityAndRequiredness.NOT_SET),
                  Expr.translate("Edge.Web.Api.Model.Null", {})
          )
      }
    }
    return {}
  }


  /** Returns an ID to use for the field matching. */
  private function getAddressFieldIdName(prop : IPropertyInfo) : AddressOwnerFieldId {
    if (_addressField != null) {
      return _addressField
    }

    final var resovedField = AddressOwnerFieldId.ALL_PCF_FIELDS.firstWhere( \ elt -> elt.Name == prop.Name)
    if (resovedField == null) {
      throw new IllegalStateException("Could not find PCF field matching " + prop.Name + " of type " + prop.OwnersType)
    }
    return resovedField
  }

}
