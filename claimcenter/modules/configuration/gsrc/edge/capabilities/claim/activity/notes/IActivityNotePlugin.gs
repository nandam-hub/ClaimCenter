package edge.capabilities.claim.activity.notes
uses edge.capabilities.note.dto.NoteDTO

/**
 * Plugin used to deal with activity notes.
 */
interface IActivityNotePlugin {
  /**
   * Returns notes for the activity.
   */
  public function getNotes(activity : Activity) : NoteDTO[]
  
  
  /**
   * Creates note from the note description. This method is called on the bundle.
   */
  public function createNote(activity : Activity, note : NoteDTO) : Note
  
  
  /**
   * Converts note into the DTO.
   */
  public function toDTO(note : Note) : NoteDTO
}
