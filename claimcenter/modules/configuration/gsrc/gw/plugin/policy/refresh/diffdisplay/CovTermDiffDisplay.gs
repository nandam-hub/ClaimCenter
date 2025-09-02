package gw.plugin.policy.refresh.diffdisplay

uses gw.api.bean.compare.EntityDiff
uses gw.api.web.UIMessageList
uses gw.plugin.policy.refresh.CoverageValidator
uses gw.plugin.policy.refresh.ui.PolicyRefreshMessageContext

/**
 * Custom DiffDisplay for CovTerm entity.
 */
@Export
class CovTermDiffDisplay extends EntityDiffDisplayBase<CovTerm>
{
  var _validator = new CoverageValidator()
    
  construct(theDiff : EntityDiff<CovTerm>, theType : gw.api.bean.compare.ui.DiffDisplay.Type) {
    super(theDiff, theType)
  }
  
  protected property get Validator() : CoverageValidator {
    return _validator
  }
  
  /**
   * Returns a list of errors and warnings associated with the Coverage Term,
   * if any.
   */
  override function getMessages(ctx : PolicyRefreshMessageContext) : UIMessageList {
    switch (Type) {
      case CHANGED:
        return _validator.performValidationCovTermChanged(Diff.SourceValue, Diff.CompareValue)
      case ADDED:
        return _validator.performValidationCovTermAdded(Diff.CompareValue)
      case REMOVED:
        return _validator.performValidationCovTermRemoved(Diff.SourceValue)
      default:
        return new UIMessageList()
    }
  }
}
