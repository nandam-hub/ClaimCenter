package edge.capabilities.enrollment.local

uses edge.capabilities.enrollment.dto.EnrollmentRequestDTO
uses edge.di.annotations.ForAllGwNodes
uses edge.exception.ApplicationErrorCode
uses edge.PlatformSupport.Bundle
uses edge.PlatformSupport.Logger
uses edge.PlatformSupport.PortalStringUtils
uses edge.PlatformSupport.Reflection
uses edge.security.authorization.Authority
uses edge.security.authorization.AuthorityType
uses java.lang.IllegalArgumentException
uses gw.api.util.DateUtil
uses gw.plugin.Plugins
uses gw.plugin.policy.search.IPolicySearchAdapter
uses java.util.Set

class DefaultEnrollmentValidationPlugin implements EnrollmentValidationPlugin {

  static enum Type {
    POLICY, ACCOUNT
  }

  final private static var _logger = new Logger(Reflection.getRelativeName(DefaultEnrollmentValidationPlugin))

  @ForAllGwNodes
  construct(){}

  override function canEnrollUser(enrollmentData: EnrollmentRequestDTO): Authority {
    enrollmentData.Details.eachKeyAndValue(\ k, v -> {
      _logger.logDebug("key: ${k}, value: ${v}")
    })

    final var policyNumber = enrollmentData.Details.get("policyNumber")
    final var policySearch = Plugins.get(IPolicySearchAdapter)
    final var policies : PolicySummary[] = Bundle.resolveInTransaction(\ bundle -> {
      var searchCriteria = new PolicySearchCriteria()
      searchCriteria.PolicyNumber = policyNumber
      return policySearch.searchPolicies(searchCriteria).Summaries;
    })

    if(policies == null or policies.length <= 0){
      throw new IllegalArgumentException(ApplicationErrorCode.GW_ENROLLMENT_INFO_VALIDATION_ERROR.getErrorCode() as String)
    }

    if(policies[0].LossDate == null){
      policies[0].LossDate = DateUtil.currentDate()
    }

    var policyResult = policySearch.retrievePolicyFromPolicySummary(policies[0]);
    if ( policyResult.Result == null || policyResult.NotUnique ) {
      _logger.logError("Error retrieving policy information from policy system")
      throw new IllegalArgumentException(ApplicationErrorCode.GW_ENROLLMENT_INFO_VALIDATION_ERROR.getErrorCode() as String)
    }
    final var proposedPolicy = policyResult.Result

    final var enrollmentAddress = enrollmentData.Details.get("addressLine1")
    if(PortalStringUtils.notBlank(enrollmentAddress) && !enrollmentAddress.equalsIgnoreCase(proposedPolicy.insured.PrimaryAddress.AddressLine1)) {
      _logger.logInfo("Primary address does not match address on file for enrollment request, denying enrollment")
      _logger.logInfo("Provided ${enrollmentAddress}, on file: ${proposedPolicy.insured.PrimaryAddress.AddressLine1}")
      throw new IllegalArgumentException(ApplicationErrorCode.GW_ENROLLMENT_INFO_VALIDATION_ERROR.getErrorCode() as String)
    }

    if (enrollmentData.Type == Type.ACCOUNT as String) {
        return new Authority(AuthorityType.ACCOUNT, proposedPolicy.AccountNumber)
    }

    return new Authority(AuthorityType.POLICY, proposedPolicy.PolicyNumber)
  }

  override function policesAccessibleWithAuthority(authority: Authority): Set<String> {
    if (authority.AuthorityType == POLICY) {
      return {authority.Target}
    }
    return {}
  }
}
