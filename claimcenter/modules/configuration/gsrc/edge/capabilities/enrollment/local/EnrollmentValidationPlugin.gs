package edge.capabilities.enrollment.local

uses edge.capabilities.enrollment.dto.EnrollmentRequestDTO
uses edge.security.authorization.Authority
uses java.util.Set

interface EnrollmentValidationPlugin {

  /**
   * Check if the user can be enrolled with the given credentials. This
   * can be an account or policy based enrolment depending data passed in.
   *
   * @return The granted authority to use.
   */
  function canEnrollUser(enrollmentData: EnrollmentRequestDTO) : Authority

  function policesAccessibleWithAuthority(authority: Authority): Set<String>

}
