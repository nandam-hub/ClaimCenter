package edge.capabilities.claim.lob.impl.commonauto

uses edge.PlatformSupport.Logger
uses edge.PlatformSupport.Reflection
uses edge.PlatformSupport.TranslateUtil
uses edge.capabilities.address.IAddressPlugin
uses edge.capabilities.address.dto.SpatialPointDTO
uses edge.capabilities.claim.contact.DefaultClaimContactPlugin
uses edge.capabilities.claim.contact.dto.ContactDTO
uses edge.capabilities.claim.lob.impl.commonauto.dto.RepairOptionDTO
uses edge.di.annotations.ForAllGwNodes
uses edge.security.authorization.IAuthorizerProviderPlugin
uses edge.util.mapping.RefUpdater
uses entity.Address
uses entity.Contact
uses entity.RepairOption_Ext
uses gw.api.contact.ContactSystemUtil
uses gw.api.database.spatial.SpatialPoint
uses gw.sampledata.SampleSpecialistServicesBase

class DefaultVehicleIncidentSRPlugin implements edge.capabilities.claim.lob.impl.commonauto.IVehicleIncidentSRPlugin {

  final private static var _logger = new Logger(Reflection.getRelativeName(DefaultVehicleIncidentSRPlugin))
  private var _addressPlugin : IAddressPlugin
  private var _vehicleIncidentPlugin : IVehicleIncidentPlugin
  private var _repairOptionUpdater : RefUpdater<VehicleIncident, RepairOption_Ext, RepairOptionDTO> as RepairOptionsUpdater
  private final var SERVICE_REQUEST = 'SERVICE_REQUEST';

  @ForAllGwNodes
  construct(addressPlugin: IAddressPlugin, vehicleIncidentPlugin: IVehicleIncidentPlugin, authzProvider: IAuthorizerProviderPlugin) {
    this._addressPlugin = addressPlugin
    this._vehicleIncidentPlugin = vehicleIncidentPlugin
    this._repairOptionUpdater = new RefUpdater<VehicleIncident, RepairOption_Ext, RepairOptionDTO>(authzProvider) {
        :ToCreate = \vi: VehicleIncident, d: RepairOptionDTO -> new RepairOption_Ext(),
        :EntityKey = \e -> e.PublicID,
        :AllowedValues = \ vi -> { return {vi.RepairOption} }
      }
  }
  override function updateRepairOption(incident: VehicleIncident, dto: RepairOptionDTO, existingRepairOption : RepairOption_Ext) {
    if (dto == null) {
      return
    }

    final var note = getRepairFacilityNote(incident.Claim, SERVICE_REQUEST)

    if (incident.RepairOption.RepairOptionChoice != dto.RepairOptionChoice) {
      // Repair option choice changed, clearing contact
      note.Claim.removeFromContacts(note.ClaimContact)
      note.ClaimContact = null
    }

    if (existingRepairOption != null) {
      incident.RepairOption = existingRepairOption
    }

    incident.RepairOption = _repairOptionUpdater.updateRef(incident, dto, \repairOption, repairOptionDto -> {
      repairOption.RepairOptionChoice = repairOptionDto.RepairOptionChoice
    })

    if (note.ClaimContact != null) {
      // Update repair facility
      if (note.ClaimContact.Contact.PublicID == dto.RepairFacility.PublicID) {
        // Update already saved repair facility
        DefaultClaimContactPlugin.updateBaseProperties(note.ClaimContact.Contact, dto.RepairFacility)
        _addressPlugin.updateFromDTO(note.ClaimContact.Contact.PrimaryAddress, dto.RepairFacility.PrimaryAddress)
        updateNoteBody(incident, note)
      } else {
        // Update recommended repair facility - remove old contact and get new from contact manager
        note.Claim.removeFromContacts(note.ClaimContact)
        createRepairFacility(incident, dto, note)
      }
    } else {
      // Create repair facility
      createRepairFacility(incident, dto, note)
    }
  }

  private function createRepairFacility(incident: VehicleIncident, dto: RepairOptionDTO, note: Note) {
    if (dto.RepairFacility != null) {
      if (incident.RepairOption.RepairOptionChoice == RepairOptionChoice_Ext.TC_NEWVENDOR) {
        note.ClaimContact = createNewRepairFacilityClaimContact(incident.Claim)
        DefaultClaimContactPlugin.updateBaseProperties(note.ClaimContact.Contact, dto.RepairFacility)
        _addressPlugin.updateFromDTO(note.ClaimContact.Contact.PrimaryAddress, dto.RepairFacility.PrimaryAddress)
      }

      if (incident.RepairOption.RepairOptionChoice == RepairOptionChoice_Ext.TC_PREFERREDVENDOR && dto.RepairFacility.AddressBookUID != null) {
        note.ClaimContact =
            createRecommendedRepairFacilityClaimContact(incident.Claim, dto.RepairFacility.AddressBookUID)
        note.ClaimContact.Contact.PrimaryAddress.SpatialPoint =
            new SpatialPoint(
                dto.RepairFacility.PrimaryAddress.SpatialPoint.Longitude,
                dto.RepairFacility.PrimaryAddress.SpatialPoint.Latitude)

        DefaultClaimContactPlugin.updateBaseProperties(note.ClaimContact.Contact, dto.RepairFacility)
        _addressPlugin.updateFromDTO(note.ClaimContact.Contact.PrimaryAddress, dto.RepairFacility.PrimaryAddress)
      }

      updateNoteBody(incident, note)
    }

    if (incident.RepairOption.RepairOptionChoice == RepairOptionChoice_Ext.TC_NOREPAIR) {
      note.Claim.removeFromNotes(note)
    }
  }

  private function updateNoteBody(incident: VehicleIncident, note: Note) {
    note.Body = TranslateUtil.translate("Edge.Web.ServiceRequest.RepairFacility.NoteBody",{
        note.ClaimContact.Contact,
        incident.Vehicle.Make,
        incident.Vehicle.Model,
        incident.Vehicle.Vin,
        incident.Vehicle.Year,
        getRepairService(incident)})
  }

  private function createNewRepairFacilityClaimContact(claim: Claim): ClaimContact {
    final var contact = new AutoRepairShop()
    contact.PrimaryAddress = new Address()
    return createClaimContact(claim, contact)
  }

  private function createRecommendedRepairFacilityClaimContact(claim: Claim, addressBookUID: String): ClaimContact {
    return createClaimContact(claim, ContactSystemUtil.importContactFromContactSystem(addressBookUID, false))
  }

  private function createClaimContact(claim: Claim, contact: Contact): ClaimContact {
    final var cc = new ClaimContact() {
      :Claim = claim,
      :Contact = contact
    }
    cc.addToRoles(new ClaimContactRole(){
        :Role = ContactRole.TC_SERVICEREQUESTSPECIALIST
        })
    return cc
  }

  override public function createServiceRequest(incident : VehicleIncident, dto : RepairOptionDTO) {
    if (dto == null || dto.RepairOptionChoice == RepairOptionChoice_Ext.TC_NOREPAIR) {
      return
    }
    var specialist: Contact

    var note = getRepairFacilityNote(incident.Claim, SERVICE_REQUEST)
    specialist = note.ClaimContact.Contact

    var serviceRequest = incident.Claim.newServiceRequest(incident.Claim.Policy.insured, incident)
    serviceRequest.Kind = getRepairService(incident) == SampleSpecialistServicesBase.AutoRepairGlass ?
        ServiceRequestKind.TC_SERVICEONLY :
        ServiceRequestKind.TC_QUOTEANDSERVICE
    serviceRequest.Specialist = specialist
    if (serviceRequest.Kind  == ServiceRequestKind.TC_SERVICEONLY) {
      serviceRequest.ExpectedServiceCompletionDateGw = serviceRequest.DefaultRequestedServiceCompletionDate
    }
    if (serviceRequest.Kind  == ServiceRequestKind.TC_QUOTEANDSERVICE) {
      serviceRequest.ExpectedQuoteCompletionDateGw = serviceRequest.DefaultRequestedQuoteCompletionDate
    }
    serviceRequest.Instruction.addService(getRepairService(incident))
    serviceRequest.Instruction.ServiceAddressGw = specialist.PrimaryAddress
    serviceRequest.finishSetup()

    if (dto.RepairOptionChoice.getValue() == RepairOptionChoice_Ext.TC_PREFERREDVENDOR) {
      serviceRequest.CoreSR.performOperation(TC_SUBMITINSTRUCTION, null, false)
    }

    incident.Claim.removeFromNotes(note)
  }

  override function toDTO(incident: VehicleIncident): RepairOptionDTO {
    if (incident.RepairOption != null) {
      var repairFacility = new ContactDTO()
      var repairOptionDTO = new RepairOptionDTO() {
          :PublicID = incident.RepairOption.PublicID,
          :RepairOptionChoice = incident.RepairOption.RepairOptionChoice,
          :VehicleIncident = _vehicleIncidentPlugin.toDTO(incident)
      }
      if (incident.RepairOption.RepairOptionChoice != RepairOptionChoice_Ext.TC_NOREPAIR) {
        if (incident.Claim.DraftClaim) {
          final var note = getRepairFacilityNote(incident.Claim, SERVICE_REQUEST)
          if (note.ClaimContact != null) {
            fillRepairFacilityDto(repairFacility, note.ClaimContact.Contact)
          } else {
            repairFacility = null
          }
        } else {
          fillRepairFacilityDto(repairFacility, incident.ServiceRequestsGw.singleWhere(\service -> service.IncidentGw == incident).Specialist)
        }
        repairOptionDTO.RepairFacility = repairFacility
      }
      return repairOptionDTO
    }
    return null
  }

  private function fillRepairFacilityDto(dto: ContactDTO, contact: Contact) {
    DefaultClaimContactPlugin.fillBaseProperties(dto, contact)
    dto.PrimaryAddress = _addressPlugin.toDto(contact.PrimaryAddress)
    dto.PrimaryAddress.SpatialPoint = new SpatialPointDTO(){
        :Latitude = contact.PrimaryAddress.SpatialPoint.Latitude,
        :Longitude = contact.PrimaryAddress.SpatialPoint.Longitude
    }
  }

  private function getRepairFacilityNote(claim: Claim, subject: String): Note {
    if (claim.Notes.countWhere(\note -> note.Subject == subject) > 1) {
      _logger.logWarn("Number of notes with subject - ${subject}. Needs to be at most one.")
    }
    final var existingNote = claim.Notes.firstWhere(\note -> note.Subject == subject)
    if (existingNote != null) {
      return existingNote
    }
    final var note = new Note() {
        :Subject = subject
        }
    note.Claim = claim
    claim.addToNotes(note)

    return note
  }

  private function getRepairService(incident: VehicleIncident) : SpecialistService {
    switch (incident.Claim.LossCause) {
      case TC_GLASSBREAKAGE:
        return SampleSpecialistServicesBase.AutoRepairGlass
      case TC_THEFTPARTS:
        return SampleSpecialistServicesBase.AutoRepairAudio
      default:
        return SampleSpecialistServicesBase.AutoRepairBody
    }
  }
}
