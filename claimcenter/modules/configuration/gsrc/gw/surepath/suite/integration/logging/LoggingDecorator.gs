package gw.surepath.suite.integration.logging

/**
 * Structural type to support logging.
 */
structure LoggingDecorator {

  /**
   * Value to use for logging. Add this property (or enhancement property) to any class or entity in order
   * to provide a specific value when logging. The return value should be in the form name=value, where
   * name identifies the object or entity, and value is the associated value. For instance, an enhancement
   * property could be added to the Note entity:
   *
   *   publid property get LoggingValue_SP() {
   *     return "Note=${this.Subject}"
   *   }
   *
   * This will cause all Notes passed to StructuredLogger to be logged with the Subject property.
   *
   * @return the value to use for logging.
   */
  public property get LoggingValue_SP() : String
}