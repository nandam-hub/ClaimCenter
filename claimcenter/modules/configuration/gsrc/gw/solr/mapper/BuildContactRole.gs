package gw.solr.mapper

uses gw.solr.utils.CCSolrUtils
uses gw.xsd.config.solr_search_config.DataProperty

@Export
class BuildContactRole implements ISolrQueryMapper<String> {
  override function mapQuery(queryDataProperties : List<DataProperty>, dataHolder : IDataHolder) : String {
    CCSolrUtils.validate((queryDataProperties.Count == 1), "Contact role query mapper can only supports 1 criteria.")

    var roleType = dataHolder.lookup(queryDataProperties.get(0)) as FreTxtClmSrchNameSrchTyp

    if (roleType == null or roleType == FreTxtClmSrchNameSrchTyp.TC_ANY) {
      return null
    } else {
      return roleType.Code
    }
  }
}