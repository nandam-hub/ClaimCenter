package gw.surepath.cc.configuration.adminaudit.base

uses gw.entity.IEntityPropertyInfo
uses gw.entity.TypeKey
uses gw.lang.reflect.IFeatureInfo
uses gw.pl.persistence.core.Bundle
uses gw.surepath.suite.configuration.annotation.IncludeInDocumentation
uses gw.surepath.suite.integration.logging.StructuredLogger

/**
 * Abstract implementation of the {@link DataAuditor} interface
 * Contains default implementations along with additional properties and functions to Audit data
 * @param <T> Generic, representing type of KeyableBean used by the concrete Auditor
 */
@IncludeInDocumentation
abstract class AbstractDataAuditor<T extends KeyableBean> implements DataAuditor {

  protected static var _logger: StructuredLogger = StructuredLogger.CONFIG.createSubcategoryLogger(DataAudit_SP.DisplayName)

  protected var _auditableBean : T as readonly AuditableBean
  private var _auditableBeanStatus: BeanStatus_SP

  construct(bean : T){
    _auditableBean = bean
    if (_auditableBean.New) {
      _auditableBeanStatus = TC_INSERTED
    } else if (_auditableBean.Bundle.RemovedBeans.contains(_auditableBean)) {
      _auditableBeanStatus = TC_REMOVED
    } else {
      _auditableBeanStatus = TC_UPDATED
    }
  }

  /**
   * Defines if the bean being considered, has met all the conditions necessary to create an AuditRecord for
   *
   * @return Boolean indicating that this Being being considered by this Auditor should have an audit record
   * created for it
   */
  @IncludeInDocumentation
  override property get ShouldAudit() : boolean {
    return AuditableBeanStatus == TC_INSERTED or AuditableBeanStatus == TC_REMOVED or
        (AuditableBeanStatus == TC_UPDATED and AuditableFieldsChanged.HasElements)
  }

  /**
   * Get the status of the bean within its bundle - inserted, updated, or removed
   * @return the bean status as a typecode value
   */
  @IncludeInDocumentation
  override property get AuditableBeanStatus(): BeanStatus_SP {
    return _auditableBeanStatus
  }

  /**
   * Retrieve all of the changed fields on a bean with a bean status of TC_UPDATED
   * @return those fields for an updated bean that have been modified
   */
  @IncludeInDocumentation
  protected property get AuditableFieldsChanged(): IFeatureInfo[] {
    if (AuditableBeanStatus == TC_UPDATED)  {
      return AuditableFields.where(\elt1 -> _auditableBean.isFieldChanged(elt1 as IEntityPropertyInfo))
    } else  {
      return {}
    }
  }

  /**
   * Transformer implementation which provides a basic transform to the displayname of the bean if of type
   * {@link TypeKey} or {@link KeyableBean}
   * @param anObject The object to retrieve the display name from
   * @return DisplayName of the provided object if of type {@link TypeKey} or {@link KeyableBean}
   */
  @IncludeInDocumentation
  protected function displayNameTransform(anObject : Object) : String {
    if (anObject typeis TypeKey) {
      return anObject.DisplayName
    }
    if (anObject typeis KeyableBean) {
      return anObject.DisplayName
    }
    return anObject as String
  }

  /**
   * Given a new data audit record, populate all of the common values where logic is the same regardless of subtype
   * @param auditRecord the newly minted and not yet committed audit record
   */
  @IncludeInDocumentation
  protected function commonPopulateAuditDataRecord(auditRecord: DataAudit_SP) {
    auditRecord.OccurrenceDate = Date.CurrentDate
    auditRecord.PerformingUser = retrieveUserForDataAuditTransaction(auditRecord.Bundle)
    auditRecord.AuditableBeanStatus = this.AuditableBeanStatus
    auditRecord.AuditableBeanDisplayName = AuditableBeanDisplayName
    auditRecord.AuditableBeanEntityType = AuditableBeanEntityType
    auditRecord.AuditBeanParentEntityType = AuditableBeanParentEntityType
    if (this.AuditableBeanStatus == TC_UPDATED) {
      for (eachChangedProperty in this.AuditableFieldsChanged) {
        var eachChangedPropertyInfo = eachChangedProperty as IEntityPropertyInfo
        var auditFieldRecord = new DataAuditFieldRecord_SP(auditRecord.Bundle)
        auditFieldRecord.DataAudit_SP = auditRecord
        auditFieldRecord.AuditableBeanChangedField = eachChangedPropertyInfo.Name
        auditFieldRecord.OriginalValue = displayNameTransform(_auditableBean.OriginalVersion.getFieldValue(eachChangedPropertyInfo.Name))
        auditFieldRecord.NewValue = displayNameTransform(_auditableBean.getFieldValue(eachChangedPropertyInfo))
      }
    }
  }

  private function retrieveUserForDataAuditTransaction(bundle: Bundle): User {
    var userToReturn = User.util.CurrentUser
    if (userToReturn != null) {
      return userToReturn
    } else {
      userToReturn = User.util.UnrestrictedUser
      if (userToReturn != null) {
        return userToReturn
      } else {
        var userQuery = gw.api.database.Query.make(entity.User)
        userQuery.compare(entity.User#SystemUserType, Equals, TC_SYSSERVICES)
        userToReturn = userQuery.select().AtMostOneRow
        userToReturn = bundle.add(userToReturn)
        return userToReturn
      }
    }
  }
}