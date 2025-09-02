package edge.capabilities.claim.lob.impl.commonauto.dto

uses edge.aspects.validation.Validation
uses edge.aspects.validation.annotations.Required
uses edge.capabilities.claim.contact.dto.ContactDTO
uses edge.el.Expr
uses edge.jsonmapper.JsonProperty

class RepairOptionDTO {
  @JsonProperty
  var _publicId: String as PublicID

  @JsonProperty
  @Required
  var _repairOptionChoice: RepairOptionChoice_Ext as RepairOptionChoice

  @JsonProperty
  @Required(Expr.any({
      Validation.getContext("RepairFacilityValidation"),
      Expr.all({
          Validation.getContext("SubmittingClaim"),
          Expr.any({
              Expr.eq(Expr.getProperty("RepairOptionChoice", Validation.PARENT), "NewVendor"),
              Expr.eq(Expr.getProperty("RepairOptionChoice", Validation.PARENT), "PreferredVendor")
          })
      })
  }))
  var _repairFacility: ContactDTO as RepairFacility

  @JsonProperty
  @Required(Expr.any({
      Expr.all({
          Validation.getContext("RepairChoiceValidation"),
          Expr.eq(Expr.getProperty("RepairOptionChoice", Validation.PARENT), null)
      }),
      Expr.all({
          Expr.any({
              Validation.getContext("RepairChoiceValidation"),
              Validation.getContext("SubmittingClaim")
          }),
          Expr.any({
              Expr.eq(Expr.getProperty("RepairOptionChoice", Validation.PARENT), "NewVendor"),
              Expr.eq(Expr.getProperty("RepairOptionChoice", Validation.PARENT), "PreferredVendor")
          })
      })
  }))
  var _vehicleIncident: VehicleIncidentDTO as VehicleIncident
}
