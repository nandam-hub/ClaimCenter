package edge.capabilities.authorization

uses edge.security.authorization.EdgeAuthorizationDTO

interface IEdgeAuthorizationPlugin {

  public function isAuthorized(entityType: String, entityID: String) : boolean
  public function getAuthorizationsForEntities(entityType: String, entityIDs: String[]): List<EdgeAuthorizationDTO>
  public function getAuthorizationsForPolicies(policyNumbers: String[]): List<EdgeAuthorizationDTO>
  public function isAuthorizedOnAccount(entityID: String) : boolean
  public function isAuthorizedOnPolicy(entityID: String) : boolean
}
