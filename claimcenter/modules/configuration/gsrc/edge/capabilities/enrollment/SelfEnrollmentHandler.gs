package edge.capabilities.enrollment

uses edge.jsonrpc.AbstractRpcHandler
uses edge.doc.ApidocAvailableSince
uses edge.doc.ApidocMethodDescription
uses edge.di.annotations.InjectableNode
uses edge.jsonrpc.annotation.JsonRpcMethod
uses edge.capabilities.enrollment.dto.EnrollmentRequestDTO
uses edge.capabilities.enrollment.local.EnrollmentValidationPlugin
uses edge.security.authorization.GrantedAuthoritiesPlugin
uses java.util.Set

class SelfEnrollmentHandler extends AbstractRpcHandler {

  private var _grantedAuthoritesPlugin:  GrantedAuthoritiesPlugin
  private var _enrollmentPlugin : EnrollmentValidationPlugin

  @InjectableNode
  @Param("enrollmentPlugin", "Plugin used to check if a given set of enrollment information matches what in the SOR")
  @Param("grantedAuthoritesPlugin", "Plugin used to add granted authorities for the authenticated user")
  construct(enrollmentPlugin : EnrollmentValidationPlugin, grantedAuthoritesPlugin: GrantedAuthoritiesPlugin){
    _enrollmentPlugin = enrollmentPlugin
    _grantedAuthoritesPlugin = grantedAuthoritesPlugin
  }

  @JsonRpcMethod
  @ApidocMethodDescription("Add Enrollment Record.")
  @ApidocAvailableSince("6.0")
  public function addEnrollmentRecord(enrollmentData: EnrollmentRequestDTO) : Set<String>{
    var authority = _enrollmentPlugin.canEnrollUser(enrollmentData)
    _grantedAuthoritesPlugin.addGrantedAuthority(authority)
    return _enrollmentPlugin.policesAccessibleWithAuthority(authority)
  }

}
