package edge.journey

uses edge.capabilities.helpers.AccountUtil
uses edge.doc.ApidocAvailableSince
uses edge.doc.ApidocMethodDescription
uses edge.di.annotations.InjectableNode
uses edge.jsonrpc.AbstractRpcHandler
uses edge.jsonrpc.annotation.JsonRpcUnauthenticatedMethod
uses edge.jsonrpc.annotation.JsonRpcMethod
uses edge.security.EffectiveUserProvider

uses java.util.HashMap
uses java.util.Map
uses java.util.List
uses java.util.ArrayList

class TimelineHandler extends AbstractRpcHandler {

  private var _sampleTimelineGenerator : ISampleTimelineGenerator
  private var _userProvider : EffectiveUserProvider as readonly UserProvider

  @InjectableNode
  construct(aSampleTimelineGenerator : ISampleTimelineGenerator, aUserProvider:EffectiveUserProvider) {
    _sampleTimelineGenerator = aSampleTimelineGenerator
    _userProvider = aUserProvider
  }

  @JsonRpcMethod
  @ApidocMethodDescription("Get timeline for accounts.")
  @ApidocAvailableSince("6.0")
  public function getTimelineForAccount(accountNumber: String): Map<String,  List<HashMap>> {
    return getTimelineEvents(accountNumber)
  }

  @JsonRpcMethod
  public function getTimeline(): Map<String,  List<HashMap>> {
    var associatedAccounts = AccountUtil.getAssociatedAccounts(_userProvider.EffectiveUser).map(\elt -> elt.AccountNumber)
    return getTimelineEvents(associatedAccounts)
  }

  // dummy implementation so returning only an empty array
  @JsonRpcUnauthenticatedMethod
  @ApidocMethodDescription("dummy implementation so returning only an empty array")
  @ApidocAvailableSince("6.0")
  function getMetaData() : Object {
    return new ArrayList()
  }

  private function getTimelineEvents(accountNumbers: List<String>): Map<String, List<HashMap>> {
    return _sampleTimelineGenerator.getSampleTimeline()
  }

  private function getTimelineEvents(accountNumber: String): Map<String, List<HashMap>> {
    return _sampleTimelineGenerator.getSampleTimeline()
  }
}

