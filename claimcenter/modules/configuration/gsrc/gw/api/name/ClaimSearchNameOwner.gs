package gw.api.name

@Export
class ClaimSearchNameOwner extends SearchNameOwner {
  construct (nameCriteria : CCNameCriteria) {
    super(nameCriteria)
  }

  override function clearNonvisibleFields() {
    super.clearNonvisibleFields()
    ContactName[SearchNameOwner.NAME_SOLR.Name] = null
  }
}
