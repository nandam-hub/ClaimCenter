package edge.capabilities.claim.contact

uses edge.capabilities.claim.contact.dto.ContactDTO

interface IContactPlugin {
  /**
   * Converts simple contact into a contact dto.
   */
  public function toDTO(contact : Contact) : ContactDTO

  /**
   * Returns an updated contact for the given contact update specification.
   */
  @Param("claim", "Claim that is related to a contact that will be updated")
  @Param("dto", "Contact specification")
  @Returns("Person matching the provided entity")
  public function getUpdatedPerson(claim: Claim, dto : ContactDTO) : Person

  /**
   * Returns an updated contact for the given contact update specification.
   */
  @Param("claim", "Claim that is related to a contact that will be updated")
  @Param("dto", "Contact specification")
  @Returns("Doctor matching the provided entity")
  public function getUpdatedDoctor(claim: Claim, dto : ContactDTO) : Doctor
}
