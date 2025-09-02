package edge.capabilities.claim.lob.shared.incidents.annotations

uses edge.aspects.validation.Validation
uses edge.aspects.validation.ValidationFunctions
uses edge.aspects.validation.dto.ValidationRuleDTO
uses edge.el.Expr
uses edge.metadata.annotation.IMetaFactory
uses edge.metadata.annotation.IMetaMultiFactory

/**
 * A shorthand annotation for making the side of body required
 * because the filter is on another typelist
 */
class RequiredSideOfBody implements IMetaMultiFactory {

  final var detailedBodyPart = Expr.getProperty("DetailedBodyPart", Validation.PARENT)

  override function getState(): Object[] {
    return {
        Validation.requiredWhen(
            Expr.call(ValidationFunctions#belongsToFilter(gw.entity.TypeKey, String), {
                detailedBodyPart, "requiresSideOfBody"
              }
            )
        )
    }
  }
}
