package edge.capabilities.claim.lob

uses edge.di.annotations.ForAllGwNodes

class AllSupportedLobsPlugin implements ISupportedLobsPlugin {

  @ForAllGwNodes("gatewayclaim")
  @ForAllGwNodes("gatewayfnol")
  @ForAllGwNodes("gatewaydocument")
  construct() {

  }

  override function getSupportedLobs(): PolicyType[] {
    return PolicyType.getTypeKeys(true).toTypedArray()
  }
}
