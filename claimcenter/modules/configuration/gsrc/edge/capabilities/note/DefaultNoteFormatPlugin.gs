package edge.capabilities.note
uses edge.di.annotations.ForAllGwNodes
uses edge.security.EffectiveUser
uses edge.security.EffectiveUserProvider
uses edge.capabilities.note.dto.NoteAuthorDTO
uses edge.capabilities.note.dto.NoteDTO

/**
 * Default note formatting plugin.
 */
class DefaultNoteFormatPlugin implements INoteFormatPlugin {

  private var _userProvider : EffectiveUserProvider as readonly UserProvider

  @ForAllGwNodes
  construct(aUserProvider:EffectiveUserProvider) {
    _userProvider = aUserProvider
  }


  override function toDTO(note : Note) : NoteDTO {
    final var res = new NoteDTO()
    fillBaseProperties(res, note)
    res.Author = getNoteAuthor(note)
    res.Body = stripOutAuthor(note.Body)
    return res
  }



  override function updateFromDTO(note : Note, update : NoteDTO) {
    var user = UserProvider.EffectiveUser
    note.Body = addNoteAuthor(update.Body, user)
    note.Subject = update.Subject
    if (!note.PortalAuthorUsername_Ext.HasContent) {
      note.PortalAuthorUsername_Ext = user.Username
    }
  }
  
  
  /**
   * Updates a note body. This function have a #stripOutAuthor as its counterpart.
   */
  protected function addNoteAuthor(body : String, user : EffectiveUser) : String {
    return  "Created by: "+ user.Username + "\n\n"+ body
  }
  
  
    
  /**
   * When we create a note from the portal front end, we add extra information in the note 
   * body detailing who created the note. This is for user of the core application to 
   * identify notes created from the portal and notes created in the core application. As 
   * this is only for applicable for the core application, when a user requests to 
   * retrieve notes from the core application we strip out this information.
   * 
   * @param body The note body to be processed
   * @return The note body with the stripped out author
   */
  protected function stripOutAuthor(body : String):String{
    if (body == null || !body.startsWith("Created by:")) {
      return body
    }
    final var authorEndIndex = body.indexOf("\n\n")
    if (authorEndIndex >= 0) {
       return body.substring(authorEndIndex + 2)
    }
    return body
  }



  /**
   * Converts note author into the note author DTO.
   */
  protected function getNoteAuthor(note : Note) : NoteAuthorDTO {
    final var user = note.Author
    if(note.PortalAuthorUsername_Ext != null){
      final var res = new NoteAuthorDTO()
      res.FirstName = note.PortalAuthorUsername_Ext
      res.LastName = ""
      return res
    }
    
    final var res = new NoteAuthorDTO()
    res.FirstName = user.Contact.FirstName
    res.LastName = user.Contact.LastName
    return res
  }



  /**
   * Fills base properties on the note DTO.
   */
  public static function fillBaseProperties(dto : NoteDTO, note : Note) {
    dto.Topic = note.Topic
    dto.Subject = note.Subject
    dto.Confidential = note.Confidential
    dto.PublicID = note.PublicID
    dto.DateCreated = note.CreateTime
  }

}
