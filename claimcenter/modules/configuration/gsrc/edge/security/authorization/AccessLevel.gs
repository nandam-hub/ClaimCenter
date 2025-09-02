package edge.security.authorization

public enum AccessLevel {
  READ, WRITE, ALL

  private construct() {
  }

  public override function toString():String {
    return this.Code
  }
}
