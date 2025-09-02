package edge.capabilities.claim.lob
uses edge.di.annotations.ForAllGwNodes


/**
 * Default supported lobs.
 */
class DefaultSupportedLobsPlugin implements ISupportedLobsPlugin {
  @ForAllGwNodes("claim")
  @ForAllGwNodes("fnol")
  @ForAllGwNodes("document")
  construct() {

  }

  override function getSupportedLobs() : PolicyType[] {
    return {
        PolicyType.TC_PERSONALAUTO,
        PolicyType.TC_HOPHOMEOWNERS,
        PolicyType.TC_GENERALLIABILITY,
        PolicyType.TC_BUSINESSOWNERS,
        PolicyType.TC_INLANDMARINE,
        PolicyType.TC_COMMERCIALPROPERTY,
        PolicyType.TC_BUSINESSAUTO,
        PolicyType.TC_WORKERSCOMP
    }
  }

}
