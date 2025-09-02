package edge.capabilities.claim.fnol.policy

uses edge.capabilities.claim.fnol.dto.FnolDTO
uses edge.capabilities.claim.fnol.policy.dto.PolicySummaryRiskUnitsDTO
uses edge.capabilities.claim.lob.fnol.policy.ILobPolicySummaryPlugin
uses edge.capabilities.claim.lob.fnol.policy.dto.PolicySummaryLobDTO
uses edge.di.annotations.ForAllGwNodes
uses edge.PlatformSupport.Bundle
uses edge.security.authorization.AuthorityType
uses gw.plugin.policy.search.IPolicySearchAdapter
uses gw.plugin.Plugins
uses java.util.HashSet
uses java.util.ArrayList
uses java.util.Date
uses edge.exception.EntityNotFoundException
uses edge.exception.DuplicateEntityException
uses edge.security.authorization.exception.AuthorizationException
uses edge.security.authorization.Authorizer
uses edge.security.EffectiveUserProvider
uses edge.capabilities.claim.fnol.policy.dto.PolicySummaryDTO
uses edge.capabilities.claim.fnol.policy.dto.PolicySearchCriteriaDTO
uses edge.capabilities.claim.lob.ISupportedLobsPlugin

/**
 * Default implementation of policy search for FNOL wizard.
 */
class DefaultPolicySearchPlugin implements IPolicySearchPlugin {
  
  private var _searchPlugin: IPolicySearchAdapter
  private var _lobPlugin : ILobPolicySummaryPlugin<PolicySummaryLobDTO>
  private var _policyAuthorizer : Authorizer<Policy>
  private var _summaryAuthorizer : Authorizer<PolicySummary>
  private var _supportedLobsPlugin : ISupportedLobsPlugin
  private var _userProvider : EffectiveUserProvider as readonly UserProvider

  @ForAllGwNodes
  @Param("supportedLobsPlugin", "Plugin used to get supported lobs")
  @Param("policyAuthorizer", "Plugin used to verify access to policy")
  @Param("summaryAuthorizer", "Authorizer for policy summaries")
  construct(supportedLobsPlugin : ISupportedLobsPlugin,
      lobPlugin : ILobPolicySummaryPlugin<PolicySummaryLobDTO>,
      policyAuthorizer : Authorizer<Policy>,
      summaryAuthorizer : Authorizer<PolicySummary>,
      aUserProvider: EffectiveUserProvider) {
    this._supportedLobsPlugin = supportedLobsPlugin
    this._lobPlugin = lobPlugin
    this._policyAuthorizer = policyAuthorizer
    this._summaryAuthorizer = summaryAuthorizer
    /* Sorry, we cannot inject platform pluging (yet?). */
    this._searchPlugin = Plugins.get(IPolicySearchAdapter)
    this._userProvider = aUserProvider
  }


  override function findPolicySummaries(criteria : PolicySearchCriteriaDTO) : PolicySummaryDTO[] {
    final var criterias = createSearchCriterias(criteria)
    if (criterias.IsEmpty) {
      return {}
    }
    return doSearch(criterias).map(\s -> toDTO(s))
  }

  override function getPolicySummaryRiskUnits(policyNumber : String, lossDate : Date) : PolicySummaryRiskUnitsDTO {
    var ps = new PolicySummaryRiskUnitsDTO()
    final var criteria = Bundle.resolveInTransaction(\ b -> {
      final var res = new PolicySearchCriteria(b.PlatformBundle)
      res.PolicyNumber = policyNumber
      res.LossDate = lossDate
      return res
    })

    final var summaries = doSearch({criteria})
    if(summaries.length != 1){
      throw new EntityNotFoundException(){:Message = "No Policy entity found", :Data = policyNumber}
    }

    ps.Lobs = _lobPlugin.toDTO(summaries.first())
    return ps
  }



  override function getPolicy(policyNumber : String, fnolDTO : FnolDTO) : Policy {
    final var criteria = Bundle.resolveInTransaction(\b -> {
      final var res = new PolicySearchCriteria(b.PlatformBundle)
      res.PolicyNumber = policyNumber
      res.LossDate = fnolDTO.LossDate
      return res
    })

    final var summaries = doSearch({criteria})
    if (summaries.length != 1) {
      throw new EntityNotFoundException(){:Message = "No Policy entity found", :Data = policyNumber}
    }

    var summary = summaries.first()
    //Add selected riskunits if any
    _lobPlugin.selectPolicySummaryRiskUnits(summary, fnolDTO)

    
    final var policyResult = _searchPlugin.retrievePolicyFromPolicySummary(summary)
    if(policyResult.NotUnique){
      throw new DuplicateEntityException(){:Message = "Duplicate policies found",:Data = summaries}
    }
    
    if (!_policyAuthorizer.canAccess(policyResult.Result)) {
      throw new AuthorizationException(){:Message = "No access to policy", :Data = policyNumber}
    }
    
    return policyResult.Result
  }


  
  /**
   * Performs a search using list of search criterias.
   */
  protected function doSearch(criterias : PolicySearchCriteria[]) : PolicySummary[] {
    final var foundIds = new HashSet<String>()
    final var foundItems = new ArrayList<PolicySummary>()
    for (var c in criterias) {
      for (var summary in _searchPlugin.searchPolicies(c).Summaries) {
        if (foundIds.add(summary.PolicyNumber)) {
          foundItems.add(summary)
        }
      }
    }
    
    return _summaryAuthorizer.access(foundItems.toTypedArray())
  }
  
  
  

  /**
   * Converts policy summary into policy DTO.
   */
  protected function toDTO(summary : PolicySummary) : PolicySummaryDTO {
    final var res = new PolicySummaryDTO()
    fillBaseProperties(res, summary)
    return res
  }
  
  
  /**
   * Creates a list of search criteria based of the current search criteria and the authroity grants
   */
  protected function createSearchCriterias(criteria: PolicySearchCriteriaDTO): PolicySearchCriteria[]{
    return Bundle.resolveInTransaction(\ b -> {
      if ((criteria.AccountNumber == null || criteria.AccountNumber.Empty) &&
          (criteria.PolicyNumber == null || criteria.PolicyNumber.Empty) &&
          (criteria.ProducerCode == null || criteria.ProducerCode.Empty))
        return createImplicitCriterias(b, criteria)
        
      return new PolicySearchCriteria[]{newSearchCriteria(b, criteria)}
    })
  }
  
  
  
  /**
   * Creates implicit search criterias limited by the user authority (when origin search criteria are not too
   * restrictive).
   */
  protected function createImplicitCriterias(b : Bundle,criteria : PolicySearchCriteriaDTO) : PolicySearchCriteria[] {
    final var user = UserProvider.EffectiveUser
    final var policyCriteria = user.getTargets(AuthorityType.POLICY).map(
      \auth -> {
        final var c = newSearchCriteria(b, criteria)
        c.PolicyNumber = auth
        return c
      })
    final var producerCriteria = user.getTargets(AuthorityType.PRODUCER).map(
      \auth -> {
        final var c = newSearchCriteria(b, criteria)
        c.ProducerCode = auth
        return c
      })
    final var accountCriteria = user.getTargets(AuthorityType.ACCOUNT).map(
      \ auth -> {
        final var c = newSearchCriteria(b, criteria)
        c.AccountNumber = auth
        return c
      }
    )
    return policyCriteria.concat(producerCriteria).concat(accountCriteria).toTypedArray()
  }


  
  /**
   * Creates a new 'PolicySearchCriteria' entity populated by a policy search dto and base policy properties.
   */
  protected function newSearchCriteria(b : Bundle, details: PolicySearchCriteriaDTO): PolicySearchCriteria { 
    final var criteria = new PolicySearchCriteria(b.PlatformBundle)
    fillCommonParameters(criteria, details)
    return criteria
  }
  
  
  
  /**
   * Fills a common "secondary" (non-vendor or policy) parameters on the policy search.
   */
  public static function fillCommonParameters(criteria : PolicySearchCriteria, dto : PolicySearchCriteriaDTO) {
    criteria.AccountNumber = dto.AccountNumber
    criteria.PolicyNumber = dto.PolicyNumber
    criteria.ProducerCode = dto.ProducerCode
    criteria.LossDate = dto.LossDate
    criteria.CompanyName = dto.CompanyName
    criteria.FirstName = dto.FirstName
    criteria.LastName = dto.LastName
    criteria.PolicyType = dto.PolicyType
    criteria.InsuredAddress.City = dto.City
    criteria.InsuredAddress.State = dto.State
    criteria.InsuredAddress.PostalCode = dto.Zip
  }
  
  
  /**
   * Fills base (gw-specified) properties on the DTO.
   */
  public static function fillBaseProperties(dto : PolicySummaryDTO, summary : PolicySummary) {
    dto.PolicyNumber = summary.PolicyNumber
    dto.EffectiveDate = summary.EffectiveDate
    dto.ExpirationDate = summary.ExpirationDate
    dto.PolicyType = summary.PolicyType
    dto.Insured = summary.InsuredName
    dto.Address = summary.Address
    dto.City = summary.City
    dto.State = summary.State
    dto.Zip = summary.PostalCode
  }


}
