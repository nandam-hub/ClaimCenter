package edge.capabilities.claim.notes
uses edge.capabilities.note.dto.NoteDTO
uses edge.di.annotations.ForAllGwNodes
uses java.util.Date
uses edge.exception.EntityNotFoundException
uses edge.capabilities.note.INoteFormatPlugin
uses edge.util.mapping.Mapper
uses edge.util.mapping.RefUpdater
uses edge.security.authorization.IAuthorizerProviderPlugin

/**
 * Default implementation of claim notes plugin.
 */
class DefaultClaimNotePlugin implements IClaimNotePlugin {
  
  private var _noteFormatPlugin : INoteFormatPlugin
  private var _mapper : Mapper as readonly Mapper
  private var _noteUpdater : RefUpdater<Claim,Note,NoteDTO>

  @ForAllGwNodes
  @Param("noteFormatPlugin", "Plugin used for note formatting")
  construct(noteFormatPlugin : INoteFormatPlugin, authzProvider:IAuthorizerProviderPlugin) {
    this._noteFormatPlugin = noteFormatPlugin
    this._mapper = new Mapper(authzProvider)
    this._noteUpdater = new RefUpdater<Claim,Note,NoteDTO>(authzProvider){
      : AllowedValues = \ c -> getClaimLevelNotes(c)
    }
  }



  override function getNotes(claim : Claim) : NoteDTO[] {
    return Mapper.mapArray(getClaimLevelNotes(claim),\ n -> toDTO(n))
  }
  


  override function createClaimNote(claim : Claim, dto : NoteDTO) : Note {
    final var note = claim.addNote(NoteTopicType.TC_GENERAL, dto.Subject)
    note.setInitialValues()
    _noteFormatPlugin.updateFromDTO(note, dto)
    createPortalNoteActivity(note)    
    return note
  }
  
  
  override function updateClaimNote(claim : Claim, update : NoteDTO) : Note {
    return _noteUpdater.updateRef(claim, update,\ n,d -> _noteFormatPlugin.updateFromDTO(n,d))
  }


  override function deleteClaimNote(claim : Claim, noteId : String) {
    final var note = getNote(claim, noteId)
    claim.removeFromNotes(note)
  }

    
  /**
   * Converts note into a DTO.
   */
  override public function toDTO(note : Note) : NoteDTO {
    return Mapper.mapRef(note,\ n -> _noteFormatPlugin.toDTO(n))
  }

  /**
   * Returns list of claim-level notes. Not all notes are claim-level, they could be
   * related to vendor or activity. We return only claim-level notes.
   */
  protected function getClaimLevelNotes(claim : Claim) : Note[] {
    return claim.Notes.where( \ note -> isClaimLevelNote(note) && Mapper.hasAccess(note))
  }


  /**
   * Checks if note is claim-level (and not activity/vendor level) note.
   */
  protected function isClaimLevelNote(note : Note) : Boolean {
    return note.RelatedTo typeis Claim
  }


  /**
   * Fetches a claim note.
   */
  protected function getNote(claim : Claim, noteId : String) : Note {
    final var targetNote = getClaimLevelNotes(claim).firstWhere(\ note -> noteId == note.PublicID)
    if (targetNote == null || !Mapper.hasAccess(targetNote)) {
      throw new EntityNotFoundException(){
        :Message = "No note entity found",
        :Data = noteId
      }
    }
    
    return targetNote
  }
  
  
  /**
   * Creates a new portal activity for the note.
   */
  protected function createPortalNoteActivity(note:Note) {
    var activity = new Activity()
    activity.Claim = note.Claim
    activity.Subject = "Note Created by Portal User"
    activity.Description = "A portal user has created a note which requires attention."
    activity.Priority = Priority.TC_NORMAL
    activity.Status = ActivityStatus.TC_OPEN
    activity.Importance = ImportanceLevel.TC_MEDIUM
    activity.TargetDate = Date.CurrentDate.addDays(2)
    note.Activity = activity
    activity.autoAssign()
  }
}
