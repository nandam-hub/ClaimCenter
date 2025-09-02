package edge.capabilities.note

uses edge.capabilities.note.dto.NoteDTO

/**
 * Plugin used for note formatting. It could either convert note into the DTO or update 
 * note using note update DTO.
 * <p>This plugin do not perform security checks on the note. Users should perform appropriate checks themselves.
 */
interface INoteFormatPlugin {
  /**
   * Converts note into the DTO.
   */
  public function toDTO(note : Note) : NoteDTO
  
  
  /**
   * Updates note content from the note DTO.
   */
  public function updateFromDTO(note : Note, update : NoteDTO)
}
