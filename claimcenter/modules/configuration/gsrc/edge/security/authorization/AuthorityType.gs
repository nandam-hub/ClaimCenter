package edge.security.authorization

public enum AuthorityType {
  NOT_SET, NONE, POLICY, ACCOUNT, CLAIM, PRODUCER, VENDOR, QUOTE;

  private construct() {
  }

  public override function toString():String {
    return this.Code
  }

}
