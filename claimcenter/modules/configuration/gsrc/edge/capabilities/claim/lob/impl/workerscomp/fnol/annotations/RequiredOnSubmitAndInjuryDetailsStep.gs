package edge.capabilities.claim.lob.impl.workerscomp.fnol.annotations

uses edge.aspects.validation.Validation
uses edge.el.Expr
uses edge.metadata.annotation.IMetaFactory

/**
 * A shorthand annotation for making a field required only on the injury details
 * wizard step and during submit. This is necessary because the injury dto is
 * used across multiple wizard screens. Only on the injury details step the required
 * fields can be populated
 */
class RequiredOnSubmitAndInjuryDetailsStep implements IMetaFactory {

  override function getState(): Object {
    var when = Expr.any({
        Expr.eq(Validation.getContext("InjuryDetailsValidation"), true),
        Expr.eq(Validation.getContext("SubmittingClaim"), true)
    })

    return Validation.requiredWhen(when, Expr.translate("Edge.Web.Api.Model.NotNull", {}))
  }
}
