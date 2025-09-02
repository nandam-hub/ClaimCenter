package gw.plugin.policy.refresh.relink.handler

uses gw.api.policy.refresh.relink.RelinkItem
uses gw.api.policy.refresh.relink.RelinkContext
uses gw.api.policy.refresh.relink.RelinkHandler
uses gw.api.policy.refresh.relink.BaseLinkHandler

/**
 * Custom relink handler for Deductible entities.
 */
@Export
class DeductibleRelinkHandler implements RelinkHandler<Deductible>
{
  delegate _handler represents RelinkHandler<Deductible>

  /**
   * Registers the custom link handler for
   * the custom link handler for the Deductible.Coverage FK.
   */
  construct() {
    _handler = new RelinkHandlerBuilder<Deductible>(Deductible)
                  .withLinkHandler("Coverage", new DeductibleCoverageLinkHandler())
                  .build()
  }

  /**
   * Custom LinkHandler for relinking the Deductible-->Coverage broken link.
   * Ignores the case where the target is removed so that Deductible.Coverage is not nulled
   * out when the Coverage is being removed, since PolicyRefreshPluginBase
   * automatically causes Deductibles to be deleted (along with other cleanup) when
   * their linked Coverages are being removed, and that only works if the Deductible
   * is still linked to the Coverage after relink.
   */
  class DeductibleCoverageLinkHandler extends BaseLinkHandler<Deductible> {

    /**
     * Ignores the case where the Coverage is removed since the Deductible will be removed
     * in this case.
     */
    override function handleRemovedLinkTarget(item:RelinkItem<Deductible>, ctx:RelinkContext) {}

    /**
     * Note that Direction here is always CLAIM_TO_POLICY.
     */
    override function handleMatchedLinkTarget(relinkItem: RelinkItem<Deductible>, relinkContext: RelinkContext, newBean: KeyableBean) {
      super.handleMatchedLinkTarget(relinkItem, relinkContext, newBean)
      var newCoverage = newBean as Coverage

      if (shouldUpdateDeductible(newCoverage)) {
        newCoverage.updateDeductibleEntry()
      }
    }

    private function shouldUpdateDeductible(coverage: Coverage): boolean {
      return gw.api.financials.FinancialsUtil.isUseDeductibleHandling()
          and coverage.New
          and (coverage.ClaimDeductible == null or coverage.ClaimDeductible.TransactionLineItems.IsEmpty)
    }
  }
}
