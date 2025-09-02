package gw.surepath.cc.configuration.timeline.enhancement

uses org.json.JSONObject
uses pcfc.expressions.SP_TimelineEntryPointExpressions


/**
 * This enhancement converts the link type in the claim timeline based on the relation to the instance of the
 * link type.
 */
enhancement TimelineLink_SPEnhancement : TimelineLink_SP {
  public function linkTypeIsInstance(type : Type) : boolean {
    return type.isAssignableFrom(gw.lang.reflect.TypeSystem.getByFullNameIfValid(this.BeanType))
  }
  public function toJSONObject() : JSONObject {
    var relatedToType = "none"
    if (this.linkTypeIsInstance(Contact)) {
      relatedToType = "contact"
    } else if (this.linkTypeIsInstance(Matter)) {
      relatedToType = "matter"
    } else if (this.linkTypeIsInstance(ServiceRequest)) {
      relatedToType = "service"
    } else if (this.linkTypeIsInstance(Exposure)) {
      relatedToType = "exposure"
    }
    var linkJSON = new JSONObject()
    linkJSON.put("BeanID", this.BeanID)
    linkJSON.put("Sequence", this.Sequence)
    //DO NOT change the SP_Timeline.do portion of this URL, or render will break. The SP_TimelineEntryPoint.pcf is dependent upon the URL here matching to its ID
    linkJSON.put("url", "SP_Timeline.do?claimNumber=${this.TimelineEntry.Timeline.Claim.ClaimNumber}"
        + "&publicID=${this.BeanID}&type=${this.BeanType}&arbitraryLink=${this.ArbitraryLinkEnum}")
    linkJSON.put("relatedToType", relatedToType)
    return linkJSON
  }
}
