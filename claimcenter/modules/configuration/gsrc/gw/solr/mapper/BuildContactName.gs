package gw.solr.mapper

uses gw.solr.utils.CCSolrUtils
uses gw.xsd.config.solr_search_config.DataProperty


/**
 * Mapper for building Contact Name(FirstName LastName) for a contact.
 */
@Export
class BuildContactName implements ISolrIndexMapper {

  override function mapIndex(inputDataProperties : List<DataProperty>, dataHolder : IDataHolder) : String {
    CCSolrUtils.validate(inputDataProperties.Count == 1, "BuildContactName mapper only supports a single target field.")

    var idp = inputDataProperties.get(0)
    var contact = dataHolder.lookup<Contact>(idp)
    if (contact typeis Person) {
      var lastName = (contact.LastName == null or contact.LastName.isEmpty()) ? "" : " ${contact.LastName}"
      return "${contact.FirstName}${lastName}"
    } else {
      return contact.Name // company name
    }
  }
}

