package edge.aspects.validation

/** Visibility and requiredness type for the field. Defines when a field is visible or if it could be ignored. */
enum VisibilityAndRequiredness {
  /** Value would be ignored by the model and should not be set. */
  NOT_SET,

  /** Value could be set or could be not set. */
  OPTIONAL,

  /** Value could not be null (must be set). */
  REQUIRED
}
