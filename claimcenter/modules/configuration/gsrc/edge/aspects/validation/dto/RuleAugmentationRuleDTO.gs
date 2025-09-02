package edge.aspects.validation.dto

uses edge.metadata.typeinfo.dto.TypedDTO
uses edge.el.dto.ExpressionDTO
uses edge.jsonmapper.JsonProperty

/** Rule describing augmentation of other rules. */
final class RuleAugmentationRuleDTO {
  /** Augmentation targets (list of child elements). */
  @JsonProperty
  private var _targets : String[] as readonly Targets

  /** Augmentation rules. */
  @JsonProperty
  private var _augments : TypedDTO[] as readonly Augments

  /** Optional condition describing a time when this augment is applied. */
  @JsonProperty
  private var _when : ExpressionDTO as readonly When

  construct(t : String[], a : IAugment[], w : ExpressionDTO) {
    this._targets = t
    this._augments = a.map( \ elt -> TypedDTO.create(elt))
    this._when = w
  }
}
