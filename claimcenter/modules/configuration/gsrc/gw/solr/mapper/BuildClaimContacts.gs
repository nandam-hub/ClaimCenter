package gw.solr.mapper

uses gw.solr.utils.CCSolrUtils
uses gw.xsd.config.solr_search_config.DataProperty
uses gw.xsd.config.solr_search_config.ResultField
uses org.apache.solr.common.SolrDocument

@Export
class BuildClaimContacts implements ISolrQueryResultMapper{

  override function mapSortColumn(resultFields : List<ResultField>, dataProperties : List<DataProperty>, dataHolder : IDataHolder) : String {
    return null //contacts column is not sortable
  }

  override function mapQueryResult(resultFields : List<ResultField>, dataProperties : List<DataProperty>, dataHolder : IDataHolder, solrResult : IResultHolder) : Object {
    CCSolrUtils.validate(resultFields.Count == 1, "Claim contact query result mapper only supports a single target field.")

    var contacts = getChildField(solrResult, resultFields.get(0))

    return contacts
        .map(\contact -> buildContactString(contact))
        .join(";\n")
  }

  private function buildContactString(contact: SolrDocument) : String {
    var contactBuilder = new StringBuilder()

    appendPropertyString(contactBuilder, contact, "contactRoles")
    appendPropertyString(contactBuilder, contact, "contactName", "", ":")
    appendPropertyString(contactBuilder, contact, "contactCity")
    appendPropertyString(contactBuilder, contact, "contactState")
    appendPropertyString(contactBuilder, contact, "contactCountry")
    appendPropertyString(contactBuilder, contact, "contactPostalCode")
    appendPropertyString(contactBuilder, contact, "contactTaxId")
    appendPropertyString(contactBuilder, contact, "contactNotes", "(", ")")

    return contactBuilder.toString()
  }

  private function appendPropertyString(builder: StringBuilder, contact: SolrDocument, propertyName: String, prefix: String = "", suffix: String = "") {
    var propertyValue = contact.get(propertyName)

    if (propertyValue == null or propertyValue.toString().trim().isEmpty()) {
      return
    }

    var leadingSpace = builder.isEmpty() ? "" : " "
    builder.append("${leadingSpace}${prefix}${propertyValue}${suffix}")
  }

  /**
   * Helper function to retrieve nested child field
   *
   * For single child, Solr converts the list into a single solr document during index
   * This function can handle both single child and multiple children
   */
  private function getChildField(solrResult: IResultHolder, resultField: ResultField) : List<SolrDocument> {
    var childResult = solrResult.lookup<Object>(resultField)

    var children: List<SolrDocument>
    if (childResult typeis SolrDocument) {
      children = {childResult}
    } else if (childResult typeis List<SolrDocument>) {
      children = childResult
    } else {
      throw new IllegalStateException("Solr is expected to return a single contact document, or a list of contact documents")
    }

    return children
  }
}