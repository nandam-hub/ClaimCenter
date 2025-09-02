package gw.vendormanagement

uses gw.core.vendormanagement.ISpecialistServiceCodeProvider

/**
 * This class is used by the core version of the Service Requests feature to access the specialist service code that are defined in a
 * customer configuration. Please refer to the upgrade guide on how to optionally adopt the Core version of ServiceRequests.
 * <p>
 * Customers should not use or maintain this class, but should use SpecialistServiceCodeConstants direcly.
 */
@Export
class SpecialistServiceCodeProvider implements ISpecialistServiceCodeProvider {

  static var _INSTANCE : SpecialistServiceCodeProvider as readonly INSTANCE = new ()

  override property get AutoInspectionRepairGlass() : String {
    return SpecialistServiceCodeConstants.AUTOINSPREPAIRGLASS
  }

  override property get AutoOtherTowing() : String {
    return SpecialistServiceCodeConstants.AUTOTOWING
  }

  override property get AutoInspectionRepairBody() : String {
    return SpecialistServiceCodeConstants.AUTOBODYREPAIR
  }

  override property get AutoAppraisal() : String {
    return SpecialistServiceCodeConstants.AUTOAPPRAISAL
  }

  override property get AutoOtherRental() : String {
    return SpecialistServiceCodeConstants.AUTORENTAL
  }

  override property get ContentsInspectIndependent() : String {
    return SpecialistServiceCodeConstants.CONTENTSINSPECTAPPRAISAL
  }

  override property get MedicalCare() : String {
    return SpecialistServiceCodeConstants.MEDICALCARE
  }

  override property get PropertyEmergencyMakeSafe() : String {
    return SpecialistServiceCodeConstants.PROPEMSMAKESAFE
  }

  override property get PropertyEmergencyDebrisRemoval() : String {
    return SpecialistServiceCodeConstants.PROPEMSDEBRISREMOVAL
  }

  override property get PropertyInspectAppraisal() : String {
    return SpecialistServiceCodeConstants.PROPINSPECTAPPRAISAL
  }
}