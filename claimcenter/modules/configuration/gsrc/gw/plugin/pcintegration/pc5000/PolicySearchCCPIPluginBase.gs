package gw.plugin.pcintegration.pc5000

uses gw.apd.model.ccpi.GeneratedProduct
uses gw.api.feature.ApdForClaimsFeatureInfo
uses gw.api.json.JsonObject
uses gw.api.locale.DisplayKey
uses gw.api.properties.RuntimePropertyRetriever
uses gw.api.system.CCLoggerCategory
uses gw.api.util.DisplayableException
uses gw.api.util.TypelistMappingUtil
uses gw.lang.reflect.TypeSystem
uses gw.plugin.Plugins
uses gw.plugin.apd.CCPIProductChecker
uses gw.plugin.policy.ccpi.contacts.PolicyContactsRetrievalManager
uses gw.plugin.policy.ccpi.coverages.PolicyCoveragesRetrievalManager
uses gw.plugin.policy.ccpi.coverages.PolicyRiskUnitCoveragesRetrievalManager
uses gw.plugin.policy.ccpi.locations.PolicyLocationsRetrievalManager
uses gw.plugin.policy.ccpi.products.GeneratedProductsManager
uses gw.plugin.policy.ccpi.retrieval.PolicyRetrievalManager
uses gw.plugin.policy.ccpi.riskunits.PolicyRiskUnitsRetrievalManager
uses gw.plugin.policy.ccpi.search.PolicySearchManager
uses gw.plugin.policy.search.IPolicySearchAdapter

uses java.text.SimpleDateFormat

/**
 * Implementation of the IPolicySearchAdapter that calls into CCPI.
 *
 * It behaves the same as PolicySearchPCPlugin, talking to PC directly via SOAP, unless enabled by additional
 * external properties to talk to CCPI.
 *
 * A IPolicySearchAdapter instance can also be passed in as a "fallback" adapter, such as your current plugin
 * implementation that uses SOAP calls to PC via CCIntegrationAPI.
 *
 * NOTE: This file should not be modified by the customer.  Make changes in PolicySearchCCPIPlugin.gs
 */
@Export
class PolicySearchCCPIPluginBase implements IPolicySearchAdapter {

  private static final var DEFAULT_POLICY_SEARCH_BACKUP_ADAPTER_PLUGIN_NAME = "IBackupPolicySearchAdapter"
  private static final var _logger = CCLoggerCategory.CCPI

  private var _generatedProductsManager : GeneratedProductsManager
  private var _policySearchManager : PolicySearchManager
  private var _policyRetrievalManager : PolicyRetrievalManager

  private var _coverageIdCodeMap : Map<String, String>
  private var _covTermPatternIdCodeMap : Map<String, String>

  private var _CCPIProductChecker : CCPIProductChecker

  // marked 'internal' for test access
  internal var _useCcpiForDefaultSearch : boolean = true
  internal var _backupPolicySearchAdapter : IPolicySearchAdapter = null

  /**
   * Constructs the plugin used for making policy search and retrieve calls to CCPI.
   *
   * Policy search will use CCPI if the policy type being searched for is not specified or the policy type is
   * specified but not supported by CCPI.
   *
   * Policy retrieval will use CCPI if the policy type is supported by CCPI.
   */
  public construct() {
    this(true)
  }

  /**
   * Constructs the plugin used for making policy search and retrieve calls to CCPI.
   *
   * If `IBackupPolicySearchAdapter` is defined, it will be used as the backup search plugin. If not it will use
   * {@link PolicySearchPCPlugin} as the backup search plugin.
   *
   * @param useCcpiForBackupSearch set to true if this plugin should fall back to using CCPI for searches where the
   *                               policy type is not specified or is specified but is not supported by CCPI
   */
  public construct(useCcpiForBackupSearch : boolean) {
    this(useCcpiForBackupSearch,
        Plugins.isEnabled(DEFAULT_POLICY_SEARCH_BACKUP_ADAPTER_PLUGIN_NAME)
            ? (IPolicySearchAdapter)(Plugins.get(DEFAULT_POLICY_SEARCH_BACKUP_ADAPTER_PLUGIN_NAME))
            : new PolicySearchPCPlugin());
  }

  /**
   * Constructs the plugin used for making policy search and retrieve calls to CCPI.
   *
   * @param useCcpiForDefaultSearch set to true if this plugin should fall back to using CCPI for searches where the
   *                                policy type is not specified or is specified but is not supported by CCPI
   *
   * @param backupPolicySearchAdapter the search adapter to use when the policy type is not supported for CCPI or
   *                                  the policy type is not specified and `useCcpiForDefaultSearch` is set to false
   *
   */
  public construct(useCcpiForDefaultSearch : boolean, backupPolicySearchAdapter : IPolicySearchAdapter) {
    if (backupPolicySearchAdapter == null) {
      throw new IllegalArgumentException("Default policy search adapter must be specified")
    }
    _useCcpiForDefaultSearch = useCcpiForDefaultSearch
    _backupPolicySearchAdapter = backupPolicySearchAdapter
    _logger.debug("PolicySearchCCPIPluginBase.construct: use CCPI for default search? [" + _useCcpiForDefaultSearch + "], " +
        "default policy search plugin: [" + getPluginName(_backupPolicySearchAdapter) + "]")
  }

  /**
   * Search for policies on the PC instance given the search criteria.
   *
   * @param criteria {@link PolicySearchCriteria used for search
   */
  override function searchPolicies(criteria : PolicySearchCriteria) : PolicySearchResultSet {
    if (useCcpiForSearch(criteria)) {
      return ccpiSearchPolicies(criteria);
    }
    return _backupPolicySearchAdapter.searchPolicies(criteria);
  }

  /**
   * Returns whether CCPI will be used when {@link #searchPolicies( PolicySearchCriteria)} is called.
   *
   * @param criteria {@link PolicySearchCriteria} search criteria
   *
   * @return returns false if CCPI is not enabled. If CCPI is enabled and a policy type is defined in the policy search
   * criteria, return true if the policy type is supported by CCPI and the policy type is not explicitly excluded.
   * Else return the value stored in {@link #isUseCcpiForDefaultSearch()}
   */
  protected function useCcpiForSearch(criteria : PolicySearchCriteria) : boolean {
    if (not CcpiEnabled) {
      return false
    }
    var productCode = criteria?.PolicyType.Code
    if (productCode != null) {
      return GeneratedProductsManager.isProductSupported(productCode) and !CCPIProductChecker.isExcluded(productCode)
    }
    return _useCcpiForDefaultSearch
  }

  // marked 'internal' for test access
  internal property get CcpiEnabled() : boolean {
    return ApdForClaimsFeatureInfo.CCPICodeGenManager.IntegrationEnabled
  }

  protected function ccpiSearchPolicies(criteria : PolicySearchCriteria) : PolicySearchResultSet {
    var pcCriteria = PolicySearchConverter.INSTANCE.createPCSearchCriteria(criteria)

    var criteriaMap = new HashMap<String, String>()
    criteriaMap.put("firstName", pcCriteria.FirstName)
    criteriaMap.put("lastName", pcCriteria.LastName)
    criteriaMap.put("companyName", pcCriteria.CompanyName)
    criteriaMap.put("policyNumber", pcCriteria.PolicyNumber)
    criteriaMap.put("producerCode", pcCriteria.ProducerCodeString)
    criteriaMap.put("productCode", pcCriteria.ProductCode)
    criteriaMap.put("primaryInsuredCity", pcCriteria.PrimaryInsuredCity)

    if (pcCriteria.AsOfDate != null) {
      var formatter = new SimpleDateFormat("yyyy-MM-dd")
      var asOfDate = formatter.format(pcCriteria.AsOfDate)
      criteriaMap.put("asOfDate", asOfDate)
    }

    var ccSummaries = PolicySearchManager.searchForPolicies(criteriaMap)

    ccSummaries.each(\s -> {
      s.LossDate = criteria.LossDate
    })

    var resultSet = new PolicySearchResultSet()
    resultSet.Summaries = ccSummaries

    return resultSet
  }

  protected function useCCPIForRetrieve(productCode : String) : boolean {
    if ((productCode == null or productCode?.Empty) or
        !ApdForClaimsFeatureInfo.CCPICodeGenManager.IntegrationEnabled or
        CCPIProductChecker.isExcluded(productCode)) {
      return false;
    }
    return GeneratedProductsManager.isProductSupported(productCode)
  }

  override function retrievePolicyFromPolicySummary(policySummary : PolicySummary) : PolicyRetrievalResultSet {
    var policyType = policySummary.PolicyType.Code
    if (useCCPIForRetrieve(policyType)) {
      var policyResultSet = PolicyRetrievalManager.retrievePolicy(policySummary)
      populatePolicy(policyType, policyResultSet);
      return policyResultSet
    }
    logBackupAdapter("retrievePolicyFromPolicySummary", policyType)
    return _backupPolicySearchAdapter.retrievePolicyFromPolicySummary(policySummary)
  }

  override function retrievePolicyFromPolicy(policy : Policy) : PolicyRetrievalResultSet {
    var policyType = policy.PolicyType.Code
    if (useCCPIForRetrieve(policyType)) {
      var policyResults = retrievePolicy(policy.getPolicyNumber(), policy.Claim.LossDate)
      populatePolicy(policyType, policyResults)
      return policyResults
    }
    logBackupAdapter("retrievePolicyFromPolicy", policyType)
    return _backupPolicySearchAdapter.retrievePolicyFromPolicy(policy)
  }

  override function retrievePolicySummaryFromPolicy(policy : Policy) : PolicySummary {
    var policyType = policy.PolicyType.Code
    if (useCCPIForRetrieve(policyType)) {
      var criteria = new PolicySearchCriteria()
      criteria.LossDate = policy.Claim.LossDate
      criteria.PolicyNumber = policy.PolicyNumber

      var results = ccpiSearchPolicies(criteria)
      var numResults = results.Summaries.Count
      if (numResults == 0) {
        return null
      }
      var policySummary = results.Summaries[0]
      policySummary.LossDate = criteria.LossDate
      return policySummary
    }
    logBackupAdapter("retrievePolicySummaryFromPolicy", policyType)
    return _backupPolicySearchAdapter.retrievePolicySummaryFromPolicy(policy)
  }

  private function populatePolicy(policyType : String, policyResultSet : PolicyRetrievalResultSet) {
    var policy = policyResultSet.getResult()

    new PolicyContactsRetrievalManager().retrievePolicyContacts(policy)
    new PolicyCoveragesRetrievalManager(CoverageIdCodeMap, CovTermIdCodeMap).retrievePolicyCoverages(policy)
    new PolicyLocationsRetrievalManager().retrievePolicyLocations(policy)

    var generatedProduct = GeneratedProductsManager.getProduct(policyType)
    var riskUnitResponses = new PolicyRiskUnitsRetrievalManager().retrievePolicyRiskUnits(policy, generatedProduct.Damageables)
    var coveragePartIds = getCoveragePartIdsFromRiskUnits(riskUnitResponses)
    retrieveCoveragesFromAllRiskUnits(policy, generatedProduct, coveragePartIds)
  }

  private function retrieveCoveragesFromAllRiskUnits(policy : Policy, generatedProduct : GeneratedProduct, coveragePartIds : Map<String, String>) {
    var retrievalManager = new PolicyRiskUnitCoveragesRetrievalManager(CoverageIdCodeMap, CovTermIdCodeMap)
    for (riskUnit in policy.RiskUnits) {
      var riskUnitName = riskUnit.IntrinsicType.RelativeName
      var damageable = generatedProduct.Damageables.firstWhere(\damageable -> damageable.RiskUnit == riskUnitName)
      var coveragePartId = coveragePartIds.get(riskUnit.PolicySystemId)
      if (damageable != null and damageable.CoverageType != null and damageable.RUEndpoint != null) {
        retrievalManager.retrievePolicyRiskUnitCoverages(
            policy, riskUnit, damageable.RUEndpoint, coveragePartId,
            \-> TypeSystem.getByFullName("entity." + damageable.CoverageType).TypeInfo
                .getConstructor({}).Constructor.newInstance({}) as RUCoverage)
      } else {
        _logger.debug("No coverages retrieved for risk unit: " + riskUnitName + ". Damageable information not complete, got: " +
            damageable.toString())
      }
    }
  }

  private function getCoveragePartIdsFromRiskUnits(riskUnitResponses : List<JsonObject>) : Map<String, String> {
    var coveragePartIds = new HashMap<String, String>()
    for (var riskUnitResponse in riskUnitResponses) {
      var data = riskUnitResponse.get("data") as ArrayList<JsonObject>
      for (var ruData in data) {
        var attributes = ruData.get("attributes") as JsonObject
        var riskUnitId = attributes.get("policySystemId") as String
        var coveragePart = attributes.get("coveragePart") as JsonObject
        var coveragePartId : String
        if (coveragePart != null) {
          coveragePartId = coveragePart.get("id") as String
        }
        coveragePartIds.put(riskUnitId, coveragePartId)
      }
    }
    return coveragePartIds
  }

  private property get CoverageIdCodeMap() : Map<String, String> {
    if (_coverageIdCodeMap == null) {
      _coverageIdCodeMap = TypelistMappingUtil.getIdentifierCodeTypeListCodeMap("CoverageType")
    }
    return _coverageIdCodeMap
  }

  private property get CovTermIdCodeMap() : Map<String, String> {
    if (_covTermPatternIdCodeMap == null) {
      _covTermPatternIdCodeMap = TypelistMappingUtil.getIdentifierCodeTypeListCodeMap("CovTermPattern")
    }
    return _covTermPatternIdCodeMap
  }

  // package protected for testing
  internal property get CCPIProductChecker() : CCPIProductChecker {
    if (_CCPIProductChecker == null) {
      _CCPIProductChecker = new CCPIProductChecker(new RuntimePropertyRetriever(RuntimePropertyGroup.TC_INTEGRATION))
    }
    return _CCPIProductChecker
  }

  // package protected for testing
  internal property get GeneratedProductsManager() : GeneratedProductsManager {
    if (_generatedProductsManager == null) {
      _generatedProductsManager = new GeneratedProductsManager()
    }
    return _generatedProductsManager
  }

  private property get PolicySearchManager() : PolicySearchManager {
    if (_policySearchManager == null) {
      _policySearchManager = new PolicySearchManager()
    }
    return _policySearchManager
  }

  private property get PolicyRetrievalManager() : PolicyRetrievalManager {
    if (_policyRetrievalManager == null) {
      _policyRetrievalManager = new PolicyRetrievalManager()
    }
    return _policyRetrievalManager
  }

  private function retrievePolicy(policyNumber : String, lossDate: Date) : PolicyRetrievalResultSet   {
    if (lossDate == null) {
      throw new DisplayableException(DisplayKey.get("Java.PolicyItemHandler.LossDateRequired"))
    }
    var resultSet = PolicyRetrievalManager.retrievePolicy(policyNumber, lossDate)
    if(PolicyStatus.TC_ARCHIVED == resultSet.Result.Status) {
      throw new DisplayableException(DisplayKey.get("Java.PolicyRefresh.PolicyIsArchived"))
    }
    resultSet.NotUnique = false
    return resultSet
  }

  private function logBackupAdapter(methodName: String, policyType : String) {
    _logger.debug("Using backup search adapter (" + _backupPolicySearchAdapter.getClass().getSimpleName() +
        " for [" + methodName + "] for policy type: " + policyType);
  }

  private function getPluginName(plugin : IPolicySearchAdapter) : String {
    if (plugin typeis java.lang.reflect.Proxy) {
      return plugin.toString().split("@").first()
    } else {
      return plugin.Class.Name
    }
  }

}
