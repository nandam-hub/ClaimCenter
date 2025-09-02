package edge.security
uses java.lang.Long
uses edge.jsonmapper.JsonProperty

class Realm {
  @JsonProperty
  private var _id:Long as Id

  @JsonProperty
  private var _realm:String as Realm

  construct() {

  }

  public static function getDefault():Realm {
    var mtRealm = new Realm()
    mtRealm._id = 1
    mtRealm._realm = "default"
    return mtRealm
  }

  public override function toString():String{
    return _id+":"+_realm
  }
}
