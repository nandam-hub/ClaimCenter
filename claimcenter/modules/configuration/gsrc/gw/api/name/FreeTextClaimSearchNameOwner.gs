package gw.api.name

@Export
class FreeTextClaimSearchNameOwner extends SearchNameOwner {
  construct (nameCriteria : CCNameCriteria) {
    super(nameCriteria)
  }

  override property get HiddenFields() : Set <NameOwnerFieldId> {
    return NameOwnerFieldId.ALL_PCF_FIELDS
  }
}
