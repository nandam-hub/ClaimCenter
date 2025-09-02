package edge.capabilities.extusermgmt.authadminconsole.vendorlookup

uses edge.jsonmapper.JsonProperty

class AuthorityTargetLookup {

  construct() {}

  construct(aDisplay: String, aTarget: String) {
    this._display = aDisplay
    this._target = aTarget
  }

  @JsonProperty
  var _display: String as Display

  @JsonProperty
  var _target: String as Target

  override public function toString() : String{
    return("Display : " + Display + ", Target: " +Target)
  }

  public override function equals(o:Object ):boolean {
    if (!(o typeis AuthorityTargetLookup)) return false
    if (Display != (o as AuthorityTargetLookup).Display) return false
    if(Target != null and Target != (o as AuthorityTargetLookup).Target)return false
    if((o as AuthorityTargetLookup).Target != null and Target == null) return false
    return true
  }

  override public function hashCode():int {
    var result:int = Target != null ? Target.hashCode() : 0
    result = 31 * result + (Display != null ? Display.hashCode() : 0)
    return result
  }


}
