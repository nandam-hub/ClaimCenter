package edge.capabilities.claim.fnol.contact
uses edge.capabilities.claim.fnol.dto.FnolRelatedContactDTO

/**
 * Plugin to deal with fnol contacts.
 */
interface IFnolContactPlugin {
  /**
   * Converts claim contact into fnol DTO.
   * May return null if access to claim contact is not possible.
   */
  public function toDTO(claim : Claim, contacts : ClaimContact[]) : FnolRelatedContactDTO[]
  
    
  /**
   * Updates contacts to match update request. Plugin should remove unneeded roles on the contacts properly update list
   * of injured persons.
   */
  public function updateContacts(claim : Claim, contacts : ClaimContact[], dtos : FnolRelatedContactDTO[])
}
