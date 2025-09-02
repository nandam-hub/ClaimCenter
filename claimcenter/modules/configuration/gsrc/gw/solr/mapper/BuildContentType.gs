package gw.solr.mapper

uses gw.solr.utils.CCSolrUtils
uses gw.xsd.config.solr_search_config.DataProperty

/**
 * Mapper for building Content Type for nested documents.
 */
@Export
class BuildContentType implements ISolrIndexMapper {
  override function mapIndex(inputDataProperties : List<DataProperty>, iDataHolder : IDataHolder) : Object {
    CCSolrUtils.validate(inputDataProperties.Count == 1, "Content type index mapper only supports a single target field.")

    return iDataHolder.lookup<KeyableBean>(inputDataProperties.get(0)).IntrinsicType.RelativeName
  }
}