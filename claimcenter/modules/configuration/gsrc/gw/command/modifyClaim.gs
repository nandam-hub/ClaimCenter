package gw.command

uses gw.api.database.Query
uses gw.api.database.Relop
uses gw.api.databuilder.AnnualAggregateTreatyBuilder
uses gw.api.databuilder.BaggageIncidentBuilder
uses gw.api.databuilder.BulkInvoiceBuilder
uses gw.api.databuilder.BulkInvoiceItemBuilder
uses gw.api.databuilder.DwellingIncidentBuilder
uses gw.api.databuilder.ExposureBuilder
uses gw.api.databuilder.FacNXolRIAgreementBuilder
uses gw.api.databuilder.FacProportionalRIAgreementBuilder
uses gw.api.databuilder.FacXolRIAgreementBuilder
uses gw.api.databuilder.FixedPropertyIncidentBuilder
uses gw.api.databuilder.IncidentBuilderBase
uses gw.api.databuilder.InjuryIncidentBuilder
uses gw.api.databuilder.LivingExpensesIncidentBuilder
uses gw.api.databuilder.NxolRIAgreementBuilder
uses gw.api.databuilder.OtherStructureIncidentBuilder
uses gw.api.databuilder.PerEventTreatyBuilder
uses gw.api.databuilder.PersonBuilder
uses gw.api.databuilder.PolicyCoverageBuilder
uses gw.api.databuilder.PropertyContentsIncidentBuilder
uses gw.api.databuilder.QuotaShareRITreatyBuilder
uses gw.api.databuilder.RIAgreementGroupBuilder
uses gw.api.databuilder.SurplusRITreatyBuilder
uses gw.api.databuilder.TripIncidentBuilder
uses gw.api.databuilder.TripRUBuilder
uses gw.api.databuilder.VehicleIncidentBuilder
uses gw.api.databuilder.XolRIAgreementBuilder
uses gw.api.financials.CheckPayeeInfo
uses gw.api.financials.CurrencyAmount
uses gw.api.financials.FinancialsCalculationUtil
uses gw.api.upgrade.Coercions
uses gw.api.util.CurrencyUtil
uses gw.api.util.Logger

uses java.math.BigDecimal

@Export
class modifyClaim extends CCBaseCommand {

  construct() {

  }

  @Argument<BigDecimal>("Amount", 503bd)
  function addExposureWithDeductible() {
    var deductibleAmount = new CurrencyAmount(getArgumentAsBigDecimal("Amount"), CurrencyUtil.getDefaultCurrency())

    var claim = CurrentClaim

    var coverage = new PolicyCoverageBuilder()
        .ofFirstTypeHavingDeductible(claim.Policy, deductibleAmount)
        .createAndCommit()

    ExposureBuilder
        .uiReadyForCoverage(coverage)
        .onClaim(claim)
        .createAndCommit()
  }

  @Argument<BigDecimal>("Amount", 2000bd)
  function setReserves() {
    var claim = CurrentClaim
    claim.Exposures.first().setAvailableReserves(TC_CLAIMCOST,TC_UNSPECIFIED , getArgumentAsBigDecimal("Amount"), User.util.CurrentUser)
    claim.Bundle.commit()
  }
  
  @Argument<BigDecimal>("Amount", 2000bd)
  @Argument("CostType", CostType.getTypeKeys(false)*.toString())
  @Argument("CostCategory", CostCategory.getTypeKeys(false)*.toString())
  function setReservesOnReserveLine() {
    var claim = CurrentClaim
    claim.Exposures.first().setAvailableReserves(typekey.CostType.get(getArgument("CostType")),typekey.CostCategory.get(getArgument("CostCategory")) , getArgumentAsBigDecimal("Amount"), User.util.CurrentUser)
    claim.Bundle.commit()
  }

  @Argument<BigDecimal>("Amount", 2000bd)
  function setClaimLevelReserves() {
    var claim = CurrentClaim
    claim.setAvailableReserves(TC_CLAIMCOST,TC_UNSPECIFIED , getArgumentAsBigDecimal("Amount"), User.util.CurrentUser)
    claim.Bundle.commit()
  }

  @Argument<BigDecimal>("Amount", 2000bd)
  @Argument("CostType", CostType.getTypeKeys(false)*.toString())
  @Argument("CostCategory", CostCategory.getTypeKeys(false)*.toString())
  function setClaimReservesOnReserveLine() {
    var claim = CurrentClaim
    claim.setAvailableReserves(typekey.CostType.get(getArgument("CostType")),typekey.CostCategory.get(getArgument("CostCategory")) , getArgumentAsBigDecimal("Amount"), User.util.CurrentUser)
    claim.Bundle.commit()
  }
  
  @Argument<BigDecimal>("Amount", 2000bd)
  function setRecoveryReserves() {
    var claim = CurrentClaim
    claim.Exposures.first().setOpenRecoveryReserves(TC_CLAIMCOST,TC_UNSPECIFIED , TC_CREDIT_LOSS ,getArgumentAsBigDecimal("Amount"), User.util.CurrentUser)
    claim.Bundle.commit()
  }
  
  @Argument<BigDecimal>("Amount", 1000bd)
  function createCheck() {
    var pay = PersonBuilder.uiReadyPerson().createAndCommit()
    var payee = new CheckPayeeInfo().withPayee(pay).withRecipient(pay).withPayTo(pay.DisplayName).withPayeeRole(TC_OTHER).withMailingAddress(pay.PrimaryAddress)
    var clm = CurrentClaim

    createOrSetReserves(clm, getArgumentAsBigDecimal("Amount"), TC_CLAIMCOST,TC_UNSPECIFIED, false)
    runWithNewBundle(\ b -> {
        clm = b.add(clm)
        var chk = clm.Exposures.first().newCheckCreator()
          .withCheckAmount(getArgumentAsBigDecimal("Amount"))
          .withCostType(TC_CLAIMCOST)
          .withCostCategory(TC_UNSPECIFIED)
          .withPrimaryPayee(payee)
          .createAndPrepareForCommit()
        return chk
      } )
  }
  
  @Argument<BigDecimal>("Amount", 1000bd)
  @Argument("CostType", CostType.getTypeKeys(false)*.toString())
  @Argument("CostCategory", CostCategory.getTypeKeys(false)*.toString())
  function createCheckOnReserveLine() {
    var pay = PersonBuilder.uiReadyPerson().createAndCommit()
    var payee = new CheckPayeeInfo().withPayee(pay).withRecipient(pay).withPayTo(pay.DisplayName).withPayeeRole(TC_OTHER).withMailingAddress(pay.PrimaryAddress)
    var clm = CurrentClaim

    createOrSetReserves(clm, getArgumentAsBigDecimal("Amount"), typekey.CostType.get(getArgument("CostType")),typekey.CostCategory.get(getArgument("CostCategory")) , false)
    runWithNewBundle(\ b -> {
        clm = b.add(clm)
        var chk = clm.Exposures.first().newCheckCreator()
            .withCheckAmount(getArgumentAsBigDecimal("Amount"))
            .withCostType(typekey.CostType.get(getArgument("CostType")))
            .withCostCategory(typekey.CostCategory.get(getArgument("CostCategory")))
            .withPrimaryPayee(payee)
            .createAndPrepareForCommit()    
        return chk
    } )
  }
  
  @Argument<BigDecimal>("Amount", 1000bd)
  function createClaimLevelCheck() {
    var pay = PersonBuilder.uiReadyPerson().createAndCommit()
    var payee = new CheckPayeeInfo().withPayee(pay).withRecipient(pay).withPayTo(pay.DisplayName).withPayeeRole(TC_OTHER).withMailingAddress(pay.PrimaryAddress)
    var clm = CurrentClaim
    
    createOrSetReserves(clm, getArgumentAsBigDecimal("Amount"), TC_CLAIMCOST,TC_UNSPECIFIED, true)
    runWithNewBundle(\ b -> {
        clm = b.add(clm)
        var chk = clm.CheckCreator
            .withCheckAmount(getArgumentAsBigDecimal("Amount"))
            .withCostType(TC_CLAIMCOST)
            .withCostCategory(TC_UNSPECIFIED)
            .withPrimaryPayee(payee)
            .createAndPrepareForCommit()    
        return chk
    } )
  }
  
  @Argument<BigDecimal>("Amount", 1000bd)
  @Argument("CostType", CostType.getTypeKeys(false)*.toString())
  @Argument("CostCategory", CostCategory.getTypeKeys(false)*.toString())
  function createClaimLevelCheckOnReserveLine() {
    var pay = PersonBuilder.uiReadyPerson().createAndCommit()
    var payee = new CheckPayeeInfo().withPayee(pay).withRecipient(pay).withPayTo(pay.DisplayName).withPayeeRole(TC_OTHER).withMailingAddress(pay.PrimaryAddress)
    var clm = CurrentClaim
    
    createOrSetReserves(clm, getArgumentAsBigDecimal("Amount") , typekey.CostType.get(getArgument("CostType")),typekey.CostCategory.get(getArgument("CostCategory")), true)
    runWithNewBundle(\ b -> {
        clm = b.add(clm)
        var chk = clm.CheckCreator
            .withCheckAmount(getArgumentAsBigDecimal("Amount"))
            .withCostType(typekey.CostType.get(getArgument("CostType")))
            .withCostCategory(typekey.CostCategory.get(getArgument("CostCategory")))
            .withPrimaryPayee(payee)
            .createAndPrepareForCommit()
        return chk
    } )
  }
  
  @Argument<BigDecimal>("Amount", 1000bd)
  function createRecovery() {
    var claim = CurrentClaim
    var payer = claim.Exposures.first().Claimant
    claim.Exposures.first().createRecovery(payer, TC_CLAIMCOST,TC_UNSPECIFIED, TC_CREDIT_LOSS, TC_EXPERTS, getArgumentAsBigDecimal("Amount"), "comments", User.util.CurrentUser)
    claim.Bundle.commit()
  }
  
  @Argument("Check Amount", "1000")
  function createBulkInvoiceSubmitted() {
    var costCategory = CostCategory.TC_UNSPECIFIED
    var costType = CostType.TC_CLAIMCOST
    var clm = CurrentClaim
    var currency = clm.Currency
    
    createOrSetReserves(clm,  (Coercions.makeBigDecimalFrom(Argument)), costType, costCategory, false)
    var BI = BulkInvoiceBuilder.uiReadyBulkInvoice()
        .withItem(new BulkInvoiceItemBuilder()
            .withClaim(clm)
            .withAmount((Coercions.makeBigDecimalFrom(Argument)).ofCurrency(currency))
            .withPaymentType(TC_PARTIAL)
            .withCostType(costType)
            .withCostCategory(costCategory)
            .withReserveLine(clm.Exposures.first().ReserveLines.firstWhere(\ r -> (r.CostType == costType && r.CostCategory == costCategory)))
            ).createAndCommitInNewBundle()
    BI.validate()
    BI.submitForApproval()
    BI.Bundle.commit()
    clm.Bundle.commit()
  }
  
  // creates reserves if the Reserveline doesn't exist, or if reserves <= the amount of the check
  function createOrSetReserves(clm:Claim , amount:BigDecimal, costType:CostType, costCategory:CostCategory, claimLevel:Boolean) {
    var totalAvailReserves = FinancialsCalculationUtil.getAvailableReserves()
    var availReserves: CurrencyAmount
    if (claimLevel == true) {

      var reserveLine = Query.make(ReserveLine)
        .and(\ restriction -> {
                restriction.compare(ReserveLine#CostType, Relop.Equals, costType)
                restriction.compare(ReserveLine#CostCategory, Relop.Equals, costCategory)
                restriction.compare(ReserveLine#Claim, Relop.Equals, clm)
                restriction.compare(ReserveLine#Exposure, Relop.Equals, null)
      }).select().FirstResult
      availReserves = totalAvailReserves.getAmount(reserveLine)
    }
    else {
      var reserveLine = Query.make(ReserveLine)
          .and(\ restriction -> {
                restriction.compare(ReserveLine#CostType, Relop.Equals, costType)
                restriction.compare(ReserveLine#CostCategory, Relop.Equals, costCategory)
                restriction.compare(ReserveLine#Claim, Relop.Equals, clm)
                restriction.compare(ReserveLine#Exposure, Relop.Equals, clm.Exposures.first())
          })
          .select().FirstResult
      availReserves = totalAvailReserves.getAmount(reserveLine)
    }
    var hasReserveLine = clm.ReserveLines.hasMatch(\ r -> {
      if (claimLevel == true) {
        return (r.CostCategory == costCategory && r.CostType == costType &&  r.Exposure == null)
      }
      else {
        return (r.CostCategory == costCategory && r.CostType == costType && r.Exposure == clm.Exposures.first())
      }
      })
    
    // Create reserveline if it doesn't exist or reserves aren't sufficient
    if ((!hasReserveLine) || (availReserves <= Coercions.makeCurrencyAmountFrom(amount))) {
        if (claimLevel == true) {
          clm.setAvailableReserves(costType,costCategory , amount*2, User.util.CurrentUser)
        }
        else {
          clm.Exposures.first().setAvailableReserves(costType,costCategory , amount*2, User.util.CurrentUser) 
        }
        clm.Bundle.commit()
    }    
  }

/**
   * Quick Jump command:  Run modifyClaim createAgreements
   * 
   * If there is no exposure, will return an error in Console : Error: Please create exposures before creating RI Agreements
   * If there is only one exposure, will create all subtypes of agreement on one agreement group associated to this exposure
   * If there are more than one exposure, will  create  2 agreement groups linking to the first 2 exposures:
   * The Treaty Agreements group will create all the treaty agreements 
   * The Facultative Agreements group will create all Fac agreements
   */
  function createAgreements() {
     var claim =  CurrentClaim
     var currency = claim.Currency
     print ("claimnumber "+claim.ClaimNumber)
     var numExposure = claim.Exposures.length
     if (numExposure ==0)
     print("Error: Please create exposures before creating RI Agreements!")
     
     else if (numExposure ==1)
     { 
       
     var group1 = RIAgreementGroupBuilder.uiReady(claim)
       .withRiskName("Agreement Group1")
       .withExposure(claim.Exposures[0])
       .create()
                   
    QuotaShareRITreatyBuilder.uiReady(currency)
        .withRecoveryLimit(250000bd.ofCurrency(currency))
        .withCededShare(25)
        .withProportionalShare(0.05)
        .withNotificationThreshold(10000bd.ofCurrency(currency))
        .withAgreementName("25% QS $250,000")
        .onRIAgreementGroup(group1)
        .create()
        
      SurplusRITreatyBuilder.uiReady(currency)
        .withCededShare(100)
        .withProportionalShare(0.60)
        .withNotificationThreshold(10000bd.ofCurrency(currency))
        .withAttachmentPoint(1000000bd.ofCurrency(currency))
        .withAgreementName("Surplus 1")
        .onRIAgreementGroup(group1)
        .create()
        
      AnnualAggregateTreatyBuilder.uiReady(currency)
        .withCededShare(100)
        .withRecoveryLimit(3000000bd.ofCurrency(currency))
        .withTopOfLayer(4000000bd.ofCurrency(currency))
        .withNotificationThreshold(10000bd.ofCurrency(currency))
        .withAttachmentPoint(4000000bd.ofCurrency(currency))
        .withAgreementName("AnnualAggregateTreaty")
        .onRIAgreementGroup(group1)
        .create()
        
      XolRIAgreementBuilder.uiReady(currency)
        .withAttachmentPoint(1000000bd.ofCurrency(currency))
        .withRecoveryLimit(3000000bd.ofCurrency(currency))
        .withTopOfLayer(4000000bd.ofCurrency(currency))
        .withNotificationThreshold(10000bd.ofCurrency(currency))
        .withAgreementName("Liability XOL")
        .onRIAgreementGroup(group1)
        .create()
        
       NxolRIAgreementBuilder.uiReady(currency)
        .withAgreementNumber("NxolRIAgreement")
        .withAttachmentPoint(1000000bd.ofCurrency(currency))
        .withTopOfLayer(3000000bd.ofCurrency(currency))
        .withNotificationThreshold(750000bd.ofCurrency(currency))
        .withCededShare(50)
        .withRecoveryLimit(100bd.ofCurrency(currency))
        .onRIAgreementGroup(group1)
        .create()
        
        PerEventTreatyBuilder.uiReady(currency)
        .withAgreementNumber("PerEvent Treaty")
        .withAttachmentPoint(1000000bd.ofCurrency(currency))
        .withRecoveryLimit(3000000bd.ofCurrency(currency))
        .withTopOfLayer(4000000bd.ofCurrency(currency))
        .withNotificationThreshold(750000bd.ofCurrency(currency))
        .withCededShare(50)
        .onRIAgreementGroup(group1)
        .create()
       
         new FacProportionalRIAgreementBuilder()
        .onRIAgreementGroup(group1)
        .withAttachmentPoint(1000000bd.ofCurrency(currency))
        .withNotificationThreshold(750000bd.ofCurrency(currency))
        .withRecoveryLimit(3000000bd.ofCurrency(currency))
        .withCededShare(50)
        .withProportionalShare(50.12345)
        .withAgreementName("FacProportionalRIAgreement")
        .create()
        
         new FacXolRIAgreementBuilder()
        .onRIAgreementGroup(group1)
        .withAttachmentPoint(1000000bd.ofCurrency(currency))
        .withTopOfLayer(3000000bd.ofCurrency(currency))
        .withNotificationThreshold(750000bd.ofCurrency(currency))
        .withRecoveryLimit(3000000bd.ofCurrency(currency))
        .withCededShare(50)
        .withAgreementName("FacXolRIAgreement")
        .create()
        
        new FacNXolRIAgreementBuilder()
        .onRIAgreementGroup(group1)
        .withAttachmentPoint(1000000bd.ofCurrency(currency))
        .withTopOfLayer(3000000bd.ofCurrency(currency))
        .withNotificationThreshold(750000bd.ofCurrency(currency))
        .withRecoveryLimit(3000000bd.ofCurrency(currency))
        .withCededShare(50)
        .withAgreementName("FacNXolRIAgreement")
        .create()
        
      group1.Bundle.commit()
      pcf.ClaimSummary.go( claim ) 
      Logger.logInfo("Create Reinsurance Agreements Completed on  "+claim.ClaimNumber)
     }
     
     else {
        RIAgreementGroupBuilder.uiReady(claim)
      .withRiskName("Treaty Agreements")
      .withExposure(claim.Exposures[0])
      .withAgreement(QuotaShareRITreatyBuilder.uiReady(currency)
        .withRecoveryLimit(250000bd.ofCurrency(currency))
        .withCededShare(25)
        .withProportionalShare(0.05)
        .withNotificationThreshold(10000bd.ofCurrency(currency))
        .withAgreementName("25% QS $250,000"))
      .withAgreement(SurplusRITreatyBuilder.uiReady(currency)
        .withCededShare(100)
        .withProportionalShare(0.60)
        .withNotificationThreshold(10000bd.ofCurrency(currency))
        .withAttachmentPoint(1000000bd.ofCurrency(currency))
        .withAgreementName("Surplus 1"))
      .withAgreement(AnnualAggregateTreatyBuilder.uiReady(currency)
        .withCededShare(100)
        .withRecoveryLimit(3000000bd.ofCurrency(currency))
        .withTopOfLayer(4000000bd.ofCurrency(currency))
        .withNotificationThreshold(10000bd.ofCurrency(currency))
        .withAttachmentPoint(4000000bd.ofCurrency(currency))
        .withAgreementName("AnnualAggregateTreaty"))
      .withAgreement(XolRIAgreementBuilder.uiReady(currency)
        .withAttachmentPoint(1000000bd.ofCurrency(currency))
        .withRecoveryLimit(3000000bd.ofCurrency(currency))
        .withTopOfLayer(4000000bd.ofCurrency(currency))
        .withNotificationThreshold(10000bd.ofCurrency(currency))
        .withAgreementName("Liability XOL"))
       .withAgreement(NxolRIAgreementBuilder.uiReady(currency)
        .withAgreementNumber("NxolRIAgreement")
        .withAttachmentPoint(1000000bd.ofCurrency(currency))
        .withTopOfLayer(3000000bd.ofCurrency(currency))
        .withNotificationThreshold(750000bd.ofCurrency(currency))
        .withCededShare(50)
        .withRecoveryLimit(100bd.ofCurrency(currency)))
       .withAgreement(PerEventTreatyBuilder.uiReady(currency)
        .withAgreementNumber("PerEvent Treaty")
        .withAttachmentPoint(1000000bd.ofCurrency(currency))
        .withRecoveryLimit(3000000bd.ofCurrency(currency))
        .withTopOfLayer(4000000bd.ofCurrency(currency))
        .withNotificationThreshold(750000bd.ofCurrency(currency))
        .withCededShare(50))
       .create()
       
       var group2 = RIAgreementGroupBuilder.uiReady(claim)
       .withRiskName("Facultative Agreements")
       .withExposure(claim.Exposures[1])
       .create()
      
    
       new FacProportionalRIAgreementBuilder()
        .onRIAgreementGroup(group2)
        .withAttachmentPoint(1000000bd.ofCurrency(currency))
        .withNotificationThreshold(750000bd.ofCurrency(currency))
        .withRecoveryLimit(3000000bd.ofCurrency(currency))
        .withCededShare(50)
        .withProportionalShare(50.12345)
        .withAgreementName("FacProportionalRIAgreement")
        .create()
        
         new FacXolRIAgreementBuilder()
        .onRIAgreementGroup(group2)
        .withAttachmentPoint(1000000bd.ofCurrency(currency))
        .withTopOfLayer(3000000bd.ofCurrency(currency))
        .withNotificationThreshold(750000bd.ofCurrency(currency))
        .withRecoveryLimit(3000000bd.ofCurrency(currency))
        .withCededShare(50)
        .withAgreementName("FacXolRIAgreement")
        .create()
        
        new FacNXolRIAgreementBuilder()
        .onRIAgreementGroup(group2)
        .withAttachmentPoint(1000000bd.ofCurrency(currency))
        .withTopOfLayer(3000000bd.ofCurrency(currency))
        .withNotificationThreshold(750000bd.ofCurrency(currency))
        .withRecoveryLimit(3000000bd.ofCurrency(currency))
        .withCededShare(50)
        .withAgreementName("FacNXolRIAgreement")
        .create()
   
    group2.Bundle.commit()
    
    pcf.ClaimSummary.go( claim ) 
    Logger.logInfo("Create Reinsurance Agreements Completed on  "+claim.ClaimNumber)
     }
  }

  @Argument("Incident Type", "vehicle")
  @Argument("Loss Party", "insured")
  function addIncident(){
    var claim = CurrentClaim

    var incidentBuilder: IncidentBuilderBase
    switch (getArgument("Incident Type").toLowerCase()) {
      case "baggage":
        incidentBuilder = BaggageIncidentBuilder.uiReadyBaggageIncident()
        break
      case "dwelling":
        incidentBuilder = DwellingIncidentBuilder.uiReadyHOPDwellingIncident()
        break
      case "fixedproperty":
        incidentBuilder = FixedPropertyIncidentBuilder.uiReadyFixedPropertyIncident()
        break
      case "injury":
        incidentBuilder = InjuryIncidentBuilder.uiReadyInjuryIncident()
        break
      case "livingexpenses":
        incidentBuilder = LivingExpensesIncidentBuilder.uiReadyHOPLivingExpensesIncident()
        break
      case "otherstructure":
        incidentBuilder = OtherStructureIncidentBuilder.uiReadyHOPOtherStructureIncident()
        break
      case "propertycontents":
        incidentBuilder = PropertyContentsIncidentBuilder.uiReadyHOPPropertyContentsIncident()
        break
      case "trip":
        incidentBuilder = TripIncidentBuilder.uiReadyTripIncident()
        if(claim.Policy.getRiskUnits(TripRU).isEmpty()){
          claim.Policy.addToRiskUnits(
              new TripRUBuilder()
                  .withRUNumber(1)
                  .withGeographicalRegion(GeographicalRegion.TC_WORLDWIDE_EX_US_CA)
                  .withTripDescription("Asia")
                  .withStartDate(CurrentDate.addDays(-1))
                  .withEndDate(CurrentDate.addDays(30))
                  .onPolicy(claim.Policy)
                  .createAndCommit())
        }
        break
      case "vehicle":
        incidentBuilder = VehicleIncidentBuilder.uiReadyVehicleIncident().withVehicleLossParty(LossPartyType.getTypeKey(getArgument("Loss Party")))
        break
      default:
        displayMessageAndExit(
            String.format("Creation of incident type: %s is not supported. Supported types are: Baggage, Dwelling, FixedProperty, Injury, LivingExpenses, Other Structure, PropertyContents, Trip and Vehicle.",
                {getArgument("Incident Type")}))
    }

    incidentBuilder.onClaim(claim).createAndCommit()

    pcf.ClaimLossDetails.go(claim)
  }

//  @Argument("test",  Query.make(Check).select(), \t ->{return (t as Check).PayTo  }) //toString : block(t : T) : String)
//  function testing() {
//    var pay = PersonBuilder.uiReadyPerson().createAndCommit()
//    var payee = new CheckPayeeInfo().withPayee(pay).withRecipient(pay).withPayTo(pay.DisplayName).withPayeeRole("other").withMailingAddress(pay.PrimaryAddress)
//
//    var clm = CurrentClaim 
//    var chk = clm.CheckCreator
//        .withCheckAmount(Argument as java.math.BigDecimal)
//        .withCostType("claimcost")
//        .withCostCategory("unspecified")
//        .withPrimaryPayee(payee)
//        .createAndPrepareForCommit()    
//    chk.Bundle.commit()
//  }

}
