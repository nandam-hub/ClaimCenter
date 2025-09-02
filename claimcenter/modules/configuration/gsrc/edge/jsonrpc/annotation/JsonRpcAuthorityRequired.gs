package edge.jsonrpc.annotation

uses edge.security.authorization.AuthorityType

@Deprecated("This annotation does not have any specific handling. JsonRpcMethod without any other security annotations"
 + " is handled in the same way as annotated by JsoRpcAuthorityRequried. Please notify us if you do use this annotation"
 + " and what handling you need. We need a feedback from end users about their specific use-cases to understand them better")
final class JsonRpcAuthorityRequired implements IAnnotation {
  private var authTypes:AuthorityType[] = null
  
  construct(types:AuthorityType[]) {
    this.authTypes = types
  }

  public property get AuthorityTypes():AuthorityType[] {
    return authTypes
  }
}
