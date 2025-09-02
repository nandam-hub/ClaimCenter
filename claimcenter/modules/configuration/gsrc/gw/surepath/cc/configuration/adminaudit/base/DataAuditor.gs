package gw.surepath.cc.configuration.adminaudit.base

uses gw.entity.IEntityType
uses gw.lang.reflect.IFeatureInfo
uses gw.pl.persistence.core.Bundle
uses gw.surepath.suite.configuration.annotation.IncludeInDocumentation

/**
 * Represents the contract which all Data Auditors must provide.
 * Auditors are responsible for inspecting an individual {@link KeyableBean} to decide if the state of the bean
 * e.g. Changes made, Bean Added/Removed warrants an Audit Record to be created
 * @param <T> Generic which extends KeyableBean to allow for typed properties and functions
 */
@IncludeInDocumentation
interface DataAuditor<T> {

  /**
   * Defines if the bean being considered, has met all the conditions necessary to create an AuditRecord for
   *
   * @return Boolean indicating that this Being being considered by this Auditor should have an audit record
   * created for it
   */
  @IncludeInDocumentation
  public property get ShouldAudit() : boolean

  /**
   * Creates the necessary admin data audit record based on the state of the bean being considered
   *
   * @param bundle the transaction bundle in which we are creating these records
   * @return a single admin data audit records representing the changes made to the considered bean
   */
  @IncludeInDocumentation
  public function createAuditDataRecords() : DataAudit_SP[]

  /**
   * Get the display name of the type of entity whose instance triggered this data audit record
   */
  @IncludeInDocumentation
  abstract property get AuditableBeanEntityType(): String

  /**
   * Get the display name of the parent for the type of entity whose instance triggered this data audit record
   * This should be set based upon the foreign key to which we are pointing the audit record itself
   * and can be the same as the type of entity whose instance triggered this data audit record
   */
  @IncludeInDocumentation
  abstract property get AuditableBeanParentEntityType(): String

  /**
   * Get the display name to be provided to the data audit entity on creation
   */
  @IncludeInDocumentation
  abstract property get AuditableBeanDisplayName(): String

  /**
   * Retrieve a set of properties for a given data auditor implementation that should trigger auditable change records
   * @return an array of IFeatureInfo objects representing the properties that should be considered auditable
   */
  @IncludeInDocumentation
  abstract property get AuditableFields(): IFeatureInfo[]

  /**
   * Get the status of the bean within its bundle - inserted, updated, or removed
   * @return the bean status as a typecode value
   */
  @IncludeInDocumentation
  abstract property get AuditableBeanStatus(): BeanStatus_SP

}