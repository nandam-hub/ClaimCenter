package gw.rest.ext.cc.claim.v1.claims.transactions

uses gw.rest.core.cc.claim.v1.claims.transactions.TransactionLineItemPreUpdateValidator

@Export
class TransactionLineItemExtPreUpdateValidator extends TransactionLineItemPreUpdateValidator {

  override function getValidLineCategoryList(transaction : Transaction) : List<LineCategory> {
    var lineCategoryList = super.getValidLineCategoryList(transaction)
    if (!(transaction typeis Payment) || transaction.Claim.SubrogationSummary == null) {
      lineCategoryList.remove(LineCategory.TC_REIMBURSEDDEDUCTIBLE)
    }
    return lineCategoryList
  }
}