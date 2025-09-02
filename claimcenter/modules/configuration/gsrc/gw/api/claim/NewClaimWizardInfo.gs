package gw.api.claim

uses com.google.common.collect.Sets
uses gw.api.locale.DisplayKey
uses gw.config.LOBAbstraction
uses gw.pcf.FNOLFindPolicyUtils
uses gw.surepath.cc.configuration.catastrophe.util.CatastropheProperties
uses gw.surepath.suite.configuration.annotation.IncludeInDocumentation
uses gw.vendormanagement.SpecialistServiceCodeConstants
uses pcf.NewClaimDuplicatesWorksheet
uses pcf.api.Location

uses java.util.AbstractSet
uses java.util.ArrayList
uses java.util.Set

uses gw.lang.reflect.IType
uses gw.api.validation.ValidationIssue

@Export
class NewClaimWizardInfo extends NewClaimWizardInfoBase {

  private var _homeownersHelper: FnolWizardHomeownersHelper
  private var _vehicleHelper: FnolWizardVehicleHelper as readonly VehicleHelper
  private var _generalLiabilityHelper: FnolWizardGeneralLiabilityHelper
  private var _manuallyModifiedExposures = Sets.newIdentityHashSet<Exposure>()
  var _assignSaveNote: Note
  var _findPolicyUtils: FNOLFindPolicyUtils as FindPolicyUtils

  private var _wizardExpressions: pcfc.expressions.FNOLWizardExpressions.FNOLWizardExpressionsImpl

  /**
   * A list of service requests that are not going to be persisted with the new claim
   */
  private var _unusedServiceRequests: Set<ServiceRequest>as readonly UnusedServiceRequests = new NonHashingServiceRequestSet()

  /**
   * A list of other service requests added to a vehicle incident that are not Towing or Auto Body Repair
   */
  private var _vehicleIncidentOtherServiceRequests: Set<ServiceRequest>as readonly VehicleIncidentOtherServiceRequests = new NonHashingServiceRequestSet()

  /**
   * A list of other service requests added to a property claim that are not ems make safe or debris removal
   */
  private var _propertyOtherServiceRequests: Set<ServiceRequest>as readonly PropertyOtherServiceRequests = new NonHashingServiceRequestSet()


  /**
   * Uses a non hashing set implementation since we are adding the Service Requests to the set
   * before they get committed and the hash code would not have been finalized yet
   * if we were adding the Service Request to a HashSet
   */
  private class NonHashingServiceRequestSet extends AbstractSet<ServiceRequest> {
    var _list = new ArrayList<ServiceRequest>()

    override function add(e: entity.ServiceRequest): boolean {
      if (!contains(e)) {
        _list.add(e)
        return true
      }
      return false
    }

    override function iterator(): java.util.Iterator<ServiceRequest> {
      return _list.iterator()
    }

    override function size(): int {
      return _list.size()
    }
  }

  construct(location: Location) {
    this(location, gw.api.claim.NewClaimCheck)
  }

  construct(location: Location, type: IType) {
    super(location, type)
    _wizardExpressions = new pcfc.expressions.FNOLWizardExpressions.FNOLWizardExpressionsImpl(NewClaimWizard)
  }

  property get AssignSaveNoteBody(): String {
    return _assignSaveNote.Body
  }

  /**
   * This is the note on the Assign & Save wizard.
   */
  property set AssignSaveNoteBody(body: String) {
    //if null, create one and add to draft Claim
    if (_assignSaveNote == null) {
      if (body != null) {
        _assignSaveNote = new Note()
        _assignSaveNote.Author = User.util.CurrentUser
        _assignSaveNote.Topic = NoteTopicType.TC_FNOL
        _assignSaveNote.Body = body
        _wizardExpressions.Claim.addToNotes(_assignSaveNote)
      }
    } else {
      if (body == null) {  //remove the note
        _wizardExpressions.Claim.removeFromNotes(_assignSaveNote)
        _assignSaveNote = null
      } else {          //change the note body
        _assignSaveNote.Body = body
      }
    }
  }

  property get VehicleHelper(): FnolWizardVehicleHelper {
    if (this._vehicleHelper == null)
      _vehicleHelper = new FnolWizardVehicleHelper(this)
    return _vehicleHelper
  }

  property get HomeownersHelper(): FnolWizardHomeownersHelper {
    if (_homeownersHelper == null) {
      _homeownersHelper = new FnolWizardHomeownersHelper(this.Claim, this)
    }
    return _homeownersHelper
  }

  property get GeneralLiabilityHelper(): FnolWizardGeneralLiabilityHelper {
    if (_generalLiabilityHelper == null) {
      _generalLiabilityHelper = new FnolWizardGeneralLiabilityHelper(this.Claim)
    }
    return _generalLiabilityHelper
  }

  property get SelectedPolicyType(): PolicyType {
    var type = PolicyDescription.PolicyVerified ? PolicyDescription.PolicySummary.PolicyType : PolicyDescription.UnverifiedPolicyType
    if (type == null) {
      // User didn't select type; can happen if re-enter wizard for draft claim
      type = _wizardExpressions.Claim.Policy.PolicyType
    }
    return type
  }

  override property get Check(): NewClaimCheck {
    return super.getCheck() as NewClaimCheck
  }

  /**
   * Method to be called if required field may have a value incompatible with
   * the full claim wizard.
   */
  function goToFullWizardFromIncompatible(returnStep: String, highWaterMark: String) {
    var isIncompatible = (FirstFinalReportedAgency == TC_VENDOR)
    if (isIncompatible) {
      _wizardExpressions.Claim.reporter = null
    }
    returnToFullWizardAndRemoveExposuresAndServiceRequests(returnStep, highWaterMark, !isIncompatible)
  }

  function getOrCreatePolicySearchCriteria() : PolicySearchCriteria {
    if (PolicySearchCriteria != null) {
      return PolicySearchCriteria
    } else {
      var searchCriteria = new PolicySearchCriteria()
      searchCriteria.PolicyType = User.util.getCurrentUser().PolicyType
      searchCriteria.PolicyNumber = _wizardExpressions.policyNumber
      return searchCriteria
    }
  }

  /**
   * Resets the Claim Wizard when the policy is changed.
   */
  function resetClaimForPolicyChange() {
    foreach (existingIncident in _wizardExpressions.Claim.Incidents) {
      _wizardExpressions.Claim.removeFromIncidents(existingIncident)
      gw.api.claim.FnolServiceRequestHelper.removeIncidentServiceRequests(existingIncident, this)
    }
    foreach (exposure in _wizardExpressions.Claim.Exposures) {
      removeExposureFromAssignments(exposure)
      _wizardExpressions.Claim.removeFromExposures(exposure)
    }
    _wizardExpressions.Claim.reporter = null
    _wizardExpressions.Claim.ReportedByType = null
    _wizardExpressions.Claim.ReportedDate = null
    _wizardExpressions.Claim.HowReported = null
    _wizardExpressions.Claim.maincontact = null
    _wizardExpressions.Claim.MainContactType = null
    _wizardExpressions.Claim.LossLocation = null
    _wizardExpressions.Claim.claimant = null
    _wizardExpressions.Claim.LOBCode = null

    _homeownersHelper = null
    _vehicleHelper = null
    _assignSaveNote = null

    setHighWaterMarkAsCurrentStep()
  }

  function repairShopOnPick(serviceRequest: ServiceRequest) {
    if (this.Check.ReadyToPay and this.Check.Payee == null) {
      var payee = serviceRequest.Specialist
      this.Check.Payee = payee
      this.Check.PayeeRole = ContactRole.TC_VENDOR
      this.Check.MailTo = payee.DisplayName
      if (this.Check.MailingAddress == null) {
        if (payee.PrimaryAddress == null) {
          this.Check.MailingAddress = new Address(serviceRequest.Bundle)
        } else {
          this.Check.MailingAddress = payee.PrimaryAddress.cloneAddress()
        }
      } else {
        if (payee.PrimaryAddress == null) {
          this.Check.MailingAddress.remove()
          this.Check.MailingAddress = new Address(serviceRequest.Bundle)
        } else {
          this.Check.MailingAddress.syncAddressFields(payee.PrimaryAddress)
        }
      }

    }
  }


  function onBeforeCommit() {
    if (isFinishingCommit()) {
      _wizardExpressions.Claim.ServiceRequests
          .where(\sr -> sr.CoreSR.operationAvailable(TC_SUBMITINSTRUCTION))
          .each(\sr -> sr.CoreSR.performOperation(TC_SUBMITINSTRUCTION, null, false))
    }
  }

  property get SearchPolicyStepTitle(): String {
    if (CurrentStepNumber == TotalNumberOfSteps as String) {
      return DisplayKey.get("Wizard.NewClaimWizard.NewClaimSelectType.OneStep")
    } else {
      return DisplayKey.get("Wizard.NewClaimWizard.NewClaimSelectType.Step", CurrentStepNumber, TotalNumberOfSteps)
    }
  }

  property get IndependentStepAllowed(): boolean {
    return !IsOnFindPolicyStep and !IsOnSelectRiskUnitStep
  }

  property get IsOnFindPolicyStep(): boolean {
    return CurrentStepId == "FindPolicy"
  }

  property get IsOnSelectRiskUnitStep(): boolean {
    return CurrentStepId == "SelectRiskUnitsStep"
  }

  function createClaim(): Claim {
    return createClaim(_wizardExpressions.PageMode ? _wizardExpressions.claimMode.LossType : null, _wizardExpressions.claimMode.QuickClaimMode as String, _wizardExpressions.LossDate,
        _wizardExpressions.PageMode)
  }

  property get IsHomeownersClaim(): boolean {
    return LOBAbstraction.ForClaim.ForLossType.isProperty(_wizardExpressions.Claim)
        and (SelectedPolicyType == LOBAbstraction.ForPolicy.HOPPolicyType
        or PolicyDescription.UnverifiedPolicyType == LOBAbstraction.ForPolicy.HOPPolicyType)
  }

  property get IsServicesStepAvailable(): boolean {
    return LOBAbstraction.ForClaim.ForLossType.isAuto(_wizardExpressions.Claim)
        || LOBAbstraction.ForClaim.ForLossType.isProperty(_wizardExpressions.Claim)
  }

  property get CanSelectRiskUnits(): boolean {
    var ps = PolicyDescription.PolicySummary
    return ps != null and ps.CanSelectRiskUnits
  }

  property get SelectRiskUnitsTitle(): String {
    var ps = PolicyDescription.PolicySummary
    if (ps == null) return ""
    if (ps.CanSelectVehicles)
      return DisplayKey.get("Wizard.NewClaimWizard.SelectRiskUnitStep.SelectAffectedVehicles.Step.Title", CurrentStepNumber, TotalNumberOfSteps)
    else if (ps.CanSelectProperties)
      return DisplayKey.get("Wizard.NewClaimWizard.SelectRiskUnitStep.SelectAffectedProperties.Step.Title", CurrentStepNumber, TotalNumberOfSteps)
    else
      return ""
  }

  property get SelectRiskUnitsLabel(): String {
    var ps = PolicyDescription.PolicySummary
    if (ps == null) return ""
    if (ps.CanSelectVehicles)
      return DisplayKey.get("Wizard.NewClaimWizard.SelectRiskUnitStep.AffectedRiskUnits.Vehicles")
    else if (ps.CanSelectProperties)
      return DisplayKey.get("Wizard.NewClaimWizard.SelectRiskUnitStep.AffectedRiskUnits.Properties")
    else
      return ""
  }

  function useOldWizardStep(): boolean {
    return false
  }

  function checkForDuplicates() {
    if (checkForNewDuplicateClaims()) {
      NewClaimDuplicatesWorksheet.goInWorkspace(this)
      throw new gw.api.util.DisplayableException(DisplayKey.get("Java.NewClaimWizard.DuplicateClaimWarning"))
    }
  }

  function checkForDuplicatesNoWarning() {
    if (checkForNewDuplicateClaims()) {
      NewClaimDuplicatesWorksheet.goInWorkspace(this)
    }
  }

  function initializeVehicleRU(exp: Exposure) {
    var vehicleRU = _wizardExpressions.Claim.Policy.Vehicles.first()

    //default to the first vehicleRU if there's vehicles on the policy
    if (vehicleRU != null) {
      //set the deductible object and the vehicleincident vehicle
      exp.VehicleIncident.Vehicle = vehicleRU.Vehicle
      exp.updateCoverage(vehicleRU)
    }
  }

  function onAutoFirstAndFinalEnter() {

    if (Check.MailingAddress != null) {
      Check.MailingAddress = null
    }

    initializeNewClaimCheck();

    _wizardExpressions.Claim.init()
    var exposures = _wizardExpressions.Claim.OrderedExposures
    var exposure: entity.Exposure
    if (exposures.length > 0) {
      exposure = exposures.single()
    } else {
      if (gw.config.LOBAbstraction.ForPolicy.isPersonalAutoPolicy(_wizardExpressions.Claim.Policy)) {
        exposure = addExposureWithNoIncident(_wizardExpressions.Claim, null, CoverageType.TC_PACOMPREHENSIVECOV, CoverageSubtype.TC_PACOMPREHENSIVECOV)
      } else {  // BusinessAuto
        exposure = addExposureWithNoIncident(_wizardExpressions.Claim, null, CoverageType.TC_BACOMPREHENSIVECOV, CoverageSubtype.TC_BACOMPREHENSIVECOV)
      }
      exposure.CreatedVia = CreatedVia.TC_UI_AUTOMATIC
    }

    var incident = exposure.ensureIncidentCreated()

    initializeVehicleRU(exposure)

    if (_wizardExpressions.Claim.ServiceRequests.IsEmpty) {
      // customer contact will get set up on exit
      var serviceRequest = _wizardExpressions.Claim.newServiceRequest(null, incident)
      serviceRequest.Instruction.addServiceFoundByCode(SpecialistServiceCodeConstants.AUTOBODYREPAIR)
      serviceRequest.Kind = ServiceRequestKind.TC_UNMANAGED
      serviceRequest.Progress = ServiceRequestProgress.TC_WORKCOMPLETE
      serviceRequest.QuoteStatus = ServiceRequestQuoteStatus.TC_NOQUOTE
      serviceRequest.RequestedQuoteCompletionDateGw = null
      serviceRequest.RequestedServiceCompletionDateGw = null
    }
  }

  function onAutoFirstAndFinalExit() {
    var checkMailingAddressError = Check.checkMailingAddress()
    if (checkMailingAddressError != null) {
      throw new gw.api.util.DisplayableException(checkMailingAddressError)
    }

    checkForDuplicates()
    Check.CostType = CostType.TC_CLAIMCOST
    Check.CostCategory = CostCategory.TC_AUTOPARTS
    changeExposureLossPartyType(LossPartyType.TC_INSURED)

    var exposure = _wizardExpressions.Claim.Exposures.single()
    // We don't have an explicit UI field to capture the Vehicle Incident Description, even though its required for the
    // exposure to get to Ability To Pay. However, we do have a UI field to capture Claim Description and, in
    // the context of Auto First & Final, these two are synonymous. Hence we just copy over one to the other.
    exposure.VehicleIncident.Description = _wizardExpressions.Claim.Description

    var serviceRequest = _wizardExpressions.Claim.ServiceRequests.single()
    serviceRequest.Currency = Check.TransactionCurrency
    serviceRequest.assignServiceRequestNumber()
    serviceRequest.Instruction.CustomerContactGw = exposure.Claimant
    serviceRequest.initializeCommMethod()

    if (Check.isReadyToPay()) {
      var currentTime = Date.Now
      var invoice = serviceRequest.CoreSR.createMinimalServiceRequestInvoice()
      invoice.ApprovalDate = currentTime
      invoice.ApprovedBy = User.util.CurrentUser
      invoice.Description = DisplayKey.get("Web.ServiceRequest.Invoice.AutomaticallyCreatedInvoiceForUnmanagedService")
      invoice.PaidBy = User.util.CurrentUser
      invoice.PaymentDate = currentTime
      invoice.Source = StatementSource.TC_MANUAL
      invoice.StatementCreationTime = currentTime
      invoice.Status = ServiceRequestInvoiceStatus.TC_CHECKCREATED
    }

    serviceRequest.recordChange(DisplayKey.get("Web.ServiceRequest.StateTransition.Description.UnmanagedServiceRequestCreated"), null, null, User.util.CurrentUser.Contact)
  }

  function FindPolicyExit() {
    // Attach real policy object only if the user doesn't have
    // the option to choose specific policy risk units and we are
    // not in Quick Claim mode

    var ps = PolicyDescription.PolicySummary
    if (ps != null) {
      ps = FindPolicyUtils.handleLossDateOutOfRange(ps, _wizardExpressions.CurrentLocation)

      if (ClaimMode.QuickClaimMode.Mode != null) {
        // no risk unit selection screen in this case, so select all
        ps.selectAllRiskUnits()
      }
    }

    if (QuickClaim != null or !CanSelectRiskUnits) {
      setPolicy()
    }

    if (_wizardExpressions.Claim.HowReported == null) {
      _wizardExpressions.Claim.HowReported = HowReportedType.TC_PHONE
    }

    updateCurrency()
  }

  function FindPolicyFirstEnter() {
    if (_wizardExpressions.claimMode != null or !_wizardExpressions.Claim.New) {
      //if claimMode is null, then the wizard is entered with a draft claim
      //reset the appropriate variables from the claim before Wizard intializes
      if (_wizardExpressions.claimMode == null) {
        _wizardExpressions.claimMode = new gw.api.claim.NewClaimMode(_wizardExpressions.Claim.LossType, null)
        PageMode = _wizardExpressions.Claim.Policy.Verified
        if (PageMode) {
          var tempPolicySearchCriteria = new PolicySearchCriteria()
          tempPolicySearchCriteria.PolicyNumber = _wizardExpressions.Claim.Policy.PolicyNumber
          tempPolicySearchCriteria.PolicyType = _wizardExpressions.Claim.Policy.PolicyType
          tempPolicySearchCriteria.LossDate = _wizardExpressions.Claim.LossDate
          //reconstructing the PolicySummary, if PolicySummary's extension isSamePolicySummary Method is changed, then this must be changed
          // to sync up as well.
          var tempPolicySummary = new PolicySummary()
          tempPolicySummary.PolicyNumber = _wizardExpressions.Claim.Policy.PolicyNumber
          tempPolicySummary.PolicyType = _wizardExpressions.Claim.Policy.PolicyType
          tempPolicySummary.EffectiveDate = _wizardExpressions.Claim.Policy.EffectiveDate
          tempPolicySummary.ExpirationDate = _wizardExpressions.Claim.Policy.ExpirationDate
          _wizardExpressions.searchCriteriaAndSummary = new gw.api.claim.NewClaimPolicySearchCriteriaAndSummary(tempPolicySearchCriteria, tempPolicySummary)
        } else {
          _wizardExpressions.policyNumber = _wizardExpressions.Claim.Policy.PolicyNumber
          _wizardExpressions.policyType = _wizardExpressions.Claim.Policy.PolicyType
        }
      }

      //initialize the Wizard
      ClaimMode = _wizardExpressions.claimMode

      if (PageMode and _wizardExpressions.searchCriteriaAndSummary != null) {
        var selectedPolicySummary = _wizardExpressions.searchCriteriaAndSummary.getCopyOfPolicySummary(_wizardExpressions.Claim)
        setPolicyDescription(selectedPolicySummary)
        savePolicySearch(_wizardExpressions.searchCriteriaAndSummary.getCopyOfPolicySearchCriteria(_wizardExpressions.Claim), selectedPolicySummary)
      } else if (!PageMode) {
        _wizardExpressions.Claim.LossType = LossType
        var policyDescription = new gw.cc.claim.NewClaimPolicyDescription()
        policyDescription.setPolicyVerified(false)
        policyDescription.setUnverifiedPolicyNumber(_wizardExpressions.policyNumber)
        policyDescription.setUnverifiedPolicyType(_wizardExpressions.policyType)
        PolicyDescription = policyDescription
        setPolicy()
      }
    }
  }

  function BasicInfoExit() {
    checkForDuplicatesNoWarning();
    if (gw.config.LOBAbstraction.ForClaim.ForLossType.isAuto(_wizardExpressions.Claim)) {
      VehicleHelper.syncVehicleIncidents(_wizardExpressions.Claim)
      var vehicleIncidents = _wizardExpressions.Claim.VehicleIncidentsOnly
      for (vehicleIncident in vehicleIncidents) {
        if (vehicleIncident.LossParty == null) {
          vehicleIncident.LossParty = LossPartyType.TC_INSURED
        }
      }
    }
    _wizardExpressions.Claim.init()
  }

  function LossDetailsFirstEnter() {
    _wizardExpressions.Claim.init()

    if (IsHomeownersClaim and HomeownersHelper.LocationChoice == null) {
      HomeownersHelper.LocationChoice = _wizardExpressions.Claim.Policy.PrimaryLocation != null ? "primary" : "other"
    }
  }

  function LossDetailsExit() {
    // if the "Primary Location" choice is highlighted, use the primary location
    // of the claim's policy as the loss location
    if (HomeownersHelper.LocationChoice == "primary") {
      _wizardExpressions.Claim.LossLocation = _wizardExpressions.Claim.Policy.PrimaryLocation.Address
    }
    gw.api.claim.FnolServiceRequestHelper.cleanAndFinishServiceRequests(this)
    addExposureForEveryIncidentIfPossible()
  }

  function onRiskUnitSelectExit() {
    // Validate at least one risk unit has been selected.
    if (PolicySummary.VehiclePolicyType) {
      validateMinimumRiskUnitsSelected(PolicySummary.Vehicles)
    } else {
      validateMinimumRiskUnitsSelected(PolicySummary.Properties)
    }

    if (_wizardExpressions.Claim.Policy != null && !PolicySummary.hasSameRiskUnits(_wizardExpressions.Claim.Policy)) {
      resetClaimForPolicyChange()
    }
    setPolicy()
  }

  function setPolicy() {
    super.setPolicy()
    VehicleHelper.AutoSelectedMarker = false
  }

  function validateMinimumRiskUnitsSelected(ru: PolicySummaryRiskUnit[]) {
    foreach (r in ru) {
      if (r.Selected) {
        return
      }
    }
    throw new gw.api.util.DisplayableException(
        DisplayKey.get("Wizard.NewClaimWizard.SelectRiskUnitStep.SelectValidation"))
  }

  function afterFinish() {
    cleanServiceRequestsLists()
    goAfterFinish()
  }

  function cleanServiceRequestsLists() {
    VehicleIncidentOtherServiceRequests.clear()
    UnusedServiceRequests.clear()
  }

  function addExposureForEveryIncidentIfPossible() {
    _wizardExpressions.Claim.Exposures
        .where(\e -> e.CreatedVia == CreatedVia.TC_BIZRULE && !_manuallyModifiedExposures.contains(e))
        .each(\e -> removeExposure(e))
    _wizardExpressions.Claim.Incidents.each(\incident ->
        gw.bizrules.BizRulesExecutor.getInstance().trigger(new gw.bizrules.context.IncidentTriggeringPoint(TriggeringPointKey.TC_CREATION, incident))
    )
    updateAssignments()
  }

  /**
   * Based upon the eligible catastrophes for this claim
   * Update to set the catastrophe on the claim if one is not already set
   */
  @IncludeInDocumentation
  function updateCatastropheAssociation_SP() {
    if (CatastropheProperties.INSTANCE.FeatureEnabled and _wizardExpressions.Claim.Catastrophe == null and _wizardExpressions.Claim.LossLocation != null) {
      var eligibleCats = _wizardExpressions.Claim.retrieveEligibleCatastrophiesForClaim()
      if (eligibleCats.Count == 1) {
        _wizardExpressions.Claim.Catastrophe = eligibleCats.single()
      } else if (eligibleCats.HasElements) {
        _wizardExpressions.Claim.Catastrophe = eligibleCats.orderByDescending(\ elt -> elt.CatastropheValidTo).first()
      }
    }
  }

  /**
   * Purges the current bundle of newly created and inserted entities during the FNOL wizard
   * process for unverified policy refresh UI event.
   *
   * @param preservePolicy keep newly inserted Policy entity and not purge it from bundle.
   */
  function resetForUnverifiedPolicyChangeEvent(preservePolicy : boolean) {
    resetClaimForPolicyChange()
    if (preservePolicy) {
      Claim.Policy.ExpirationDate = null
      Claim.Policy.EffectiveDate = null
    }

    var bundle = NewClaimWizard.Bundle
    for (b in bundle.InsertedBeans) {
      if (not ((b typeis Claim) or (b typeis ClaimAccess) or ((b typeis Policy) and preservePolicy))) {
        bundle.delete(b)
      }
    }
    NewClaimWizard.completeResetStateAfterUnverifiedPolicySelectEvent()
  }

  /**
   * Remove the given exposure from claim, incident and assignments, then mark the bean for remove.
   */
  function removeExposure(exposure: Exposure) {
    _wizardExpressions.Claim.removeFromExposures(exposure)
    exposure.getIncident().removeFromExposures(exposure)
    removeExposureFromAssignments(exposure)
    _manuallyModifiedExposures.remove(exposure)
  }

  /**
   * Remove the given exposure from claim, incident and assignments, then mark the bean for remove.
   */
  function removeExposureWithRenumbering(exposure: Exposure) {
    removeExposure(exposure)
    NewClaimWizard.renumberExposures(true, false)
  }

  function markExposureAsManuallyModified(e: Exposure) {
    _manuallyModifiedExposures.add(e)
  }

  function isMainContactOrReporter(value: Object): boolean {
    return value == _wizardExpressions.Claim.maincontact or value == _wizardExpressions.Claim.reporter
  }

  function isPartiesInvolvedValidation(value: Object): boolean {
    var contact : Contact
    if (value typeis Contact) {
      contact = value
    } else if (value typeis Address) {
      contact = value.ContactWhereThisIsPrimary
    } else {
      return false
    }
    return Claim.getClaimContact(contact) != null and !isMainContactOrReporter(contact)
  }

  function isServiceRequest(issue: ValidationIssue): boolean {
    return issue.EntityValidation.EntityId.Type.RelativeName.equals("ServiceRequest");
  }

  function finishSetupServiceRequests() {
    _wizardExpressions.Claim.finishSetupServiceRequests()
  }

  property get ExposureListChangeable(): boolean {
    return _wizardExpressions.Claim.ExposureListChangeable
  }

  function initClaim() {
    _wizardExpressions.Claim.init()
  }

  property get IsLossTypeSet(): boolean {
    return _wizardExpressions.Claim.HasLossType
  }
}
