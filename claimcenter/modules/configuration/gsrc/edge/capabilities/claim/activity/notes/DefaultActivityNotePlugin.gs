package edge.capabilities.claim.activity.notes
uses edge.capabilities.note.dto.NoteDTO
uses edge.security.EffectiveUserProvider
uses edge.di.annotations.ForAllGwNodes
uses edge.capabilities.note.INoteFormatPlugin

/**
 * Activity note plugin.
 */
class DefaultActivityNotePlugin implements IActivityNotePlugin {

  private var _noteFormatPlugin : INoteFormatPlugin

  private var _userProvider : EffectiveUserProvider as readonly UserProvider

  @ForAllGwNodes
  @Param("noteFormatPlugin", "Plugin used for note formatting")
  construct(noteFormatPlugin : INoteFormatPlugin, aUserProvider:EffectiveUserProvider) {
    this._noteFormatPlugin = noteFormatPlugin
    this._userProvider = aUserProvider
  }


  override function getNotes(activity : Activity) : NoteDTO[] {
    return activity.Claim.Notes
      .where(\note ->note.Activity == activity && canAccess(note))
      .map(\note -> toDTO(note))
  }



  override function createNote(activity : Activity, dto: NoteDTO) : Note {
    final var note = activity.NewNote
    _noteFormatPlugin.updateFromDTO(note, dto)
    note.Topic = NoteTopicType.TC_GENERAL
    note.ClaimContact = activity.ExternalOwnerCC
    return note
  }
  
  
  
  /**
   * Converts note into a DTO.
   */
  override function toDTO(note : Note) : NoteDTO {
    if (!canAccess(note)) {
      return null
    }
    return _noteFormatPlugin.toDTO(note)
  }
  

  
  /**
   * Checks if user have access to the specific note.
   */
  protected function canAccess(note : Note) : boolean {
    if(!note.PortalAuthorUsername_Ext.HasContent) {
      return false
    }
    
    return note.PortalAuthorUsername_Ext.equalsIgnoreCase(UserProvider.EffectiveUser.Username)
  }

}
