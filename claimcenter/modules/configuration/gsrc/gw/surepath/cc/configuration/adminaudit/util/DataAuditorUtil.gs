package gw.surepath.cc.configuration.adminaudit.util

uses gw.api.locale.DisplayKey
uses gw.lang.reflect.IConstructorInfo
uses gw.lang.reflect.IType
uses gw.lang.reflect.TypeSystem
uses gw.pl.persistence.core.Bundle
uses gw.surepath.cc.configuration.adminaudit.base.DataAuditor
uses gw.surepath.cc.configuration.adminaudit.base.DataAuditorTransactionCallback
uses gw.surepath.suite.configuration.annotation.IncludeInDocumentation
uses gw.surepath.suite.integration.logging.StructuredLogger


/**
 * Utility class to provide access to the Data Auditing feature
 */
@IncludeInDocumentation
class DataAuditorUtil {

  private static var _logger = StructuredLogger.CONFIG.createSubcategoryLogger(DataAudit_SP.DisplayName)

  /**
   * Either creates a new bundle transaction callback for admin data audit processing...
   * ...or reuses an existing one that already has been created
   *
   * @return the data auditor transaction callback either newly created or found and reused
   */
  @IncludeInDocumentation
  public static function getOrCreateCallbackFor(bundle: Bundle): DataAuditorTransactionCallback {
    for (var callback in bundle.BundleTransactionCallbacks) {
      if (callback typeis DataAuditorTransactionCallback) {
        return callback
      }
    }
    var newCallback = new DataAuditorTransactionCallback()
    bundle.addBundleTransactionCallback(newCallback)
    return newCallback
  }

  /**
   * Decides if the beans in the provided preUpdate context should be audited
   * @param beans the beans that may be audited
   */
  @IncludeInDocumentation
  public static function maybeAuditBeans(bundle: Bundle) {
    var subtypes = retrieveAllNonAbstractDataAuditorSubtypes()
    var allEligibleBeans = retrieveAllBeansFromBundle(bundle)
    var typeToConstructorInfoMap = populateTypeToConstructorInfoMap(subtypes)
    for (eachBean in allEligibleBeans) {
      var beanName = (typeof eachBean).Name
      var beanType = TypeSystem.parseType("${beanName.replaceAll(" ", "")}")
      var matchingConstructorInfo = typeToConstructorInfoMap.get(beanType)
      maybeAuditBean(eachBean, matchingConstructorInfo)
    }
  }

  public static function populateTypeToConstructorInfoMap(subtypes: List<IType>): HashMap<IType, IConstructorInfo> {
    var typeToConstructorInfoMap = new HashMap<IType, IConstructorInfo>()
    for (eachType in subtypes) {
      var possiblyCallableConstructorInfos = eachType.TypeInfo.Constructors.where(\elt -> elt.Parameters.Count == 1)
      for (eachConstructorInfo in possiblyCallableConstructorInfos) {
        var parameterType = eachConstructorInfo.Parameters.single().Type
        if (typeToConstructorInfoMap.get(parameterType) != null) {
          throw new IllegalArgumentException("Multiple possible constructors exist for the given entity type, this is not allowed")
        }
        typeToConstructorInfoMap.put(parameterType, eachConstructorInfo)
      }
    }
    return typeToConstructorInfoMap
  }

  public static function retrieveAllNonAbstractDataAuditorSubtypes(): List<IType> {
    return DataAuditor.Type.Subtypes.where(\elt -> not elt.Abstract and not elt.Interface)
  }

  private static function maybeAuditBean(eachBean: KeyableBean, matchingConstructorInfo: IConstructorInfo) {
    if (matchingConstructorInfo != null) {
      var constructor = matchingConstructorInfo.Constructor.newInstance({eachBean})
      var dataAuditorInstance = constructor as DataAuditor
      if (dataAuditorInstance.ShouldAudit) {
        var auditRecords = dataAuditorInstance.createAuditDataRecords()
        for (auditRecord in auditRecords) {
          auditRecord.addEvent(DisplayKey.get("SP.AdminAudit.Messaging.SendToExternalSystem"))
        }
      }
    }
  }

  private static function retrieveAllBeansFromBundle(bundle: Bundle): Set<KeyableBean> {
    return bundle.InsertedBeans.union(bundle.UpdatedBeans).union(bundle.RemovedBeans)
  }

}