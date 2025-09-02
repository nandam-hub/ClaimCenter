package edge.uaaoperations.dto

/**
* Enum used to represent the different filters used in SCIM calls. See
* https://tools.ietf.org/html/draft-ietf-scim-api-00#section-3.2.1
* for the full list and specification.
 */
enum ScimFilterOperator {

  EQUALS("eq"),
  CONTAINS("co"),
  STARTS_WITH("sw"),
  PRESENT("pr"),
  GREATER_THAN("gt"),
  GREATER_EQUAL("ge"),
  LESS_THAN("lt"),
  LESS_EQUAL("le")

  private var _scimFilter : String as readonly filterStr

  private construct(filter : String){
    this._scimFilter = filter
  }
}
