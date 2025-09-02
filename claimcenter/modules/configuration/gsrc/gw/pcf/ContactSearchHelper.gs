package gw.pcf

@Export
class ContactSearchHelper {

  construct(searchByProximity : boolean) {
    _searchContactsByProximity = searchByProximity;
  }

  var _searchContactsByProximity : boolean as searchContactsByProximity

}
