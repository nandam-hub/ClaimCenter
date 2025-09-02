package edge.capabilities.claim.notes
uses edge.capabilities.note.dto.NoteDTO

/**
 * API used to access claim notes.
 */
interface IClaimNotePlugin {
  /**
   * Returns all claim notes available to the given user.
   */
  public function getNotes(claim : Claim) : NoteDTO[]
  
  
  /**
   * Creates a new note associated with the claim. This method is called within
   * an active transaction bundle.
   */
  public function createClaimNote(claim : Claim, note : NoteDTO) : Note
  
  
  /**
   * Updates claim note and returns updated note.
   */
  public function updateClaimNote(claim : Claim, update : NoteDTO) : Note
  
  
  
  /**
   * Deletes claim note.
   */
  public function deleteClaimNote(claim : Claim, noteId : String)
  
  
  /**
   * Converts previously created or updated note into the DTO.
   */
  public function toDTO(note : Note) : NoteDTO
}
