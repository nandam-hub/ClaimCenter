package edge.capabilities.claim.activity

uses edge.doc.ApidocAvailableSince
uses edge.doc.ApidocMethodDescription
uses edge.jsonrpc.AbstractRpcHandler
uses edge.di.annotations.InjectableNode
uses edge.jsonrpc.annotation.JsonRpcMethod
uses edge.capabilities.claim.activity.notes.IActivityNotePlugin
uses edge.capabilities.note.dto.NoteDTO
uses edge.exception.IllegalStateException
uses edge.PlatformSupport.Bundle
uses edge.capabilities.note.INoteFormatPlugin
uses edge.capabilities.claim.activity.dto.ActivityDTO
uses edge.capabilities.claim.activity.dto.ActivitySearchDTO
uses edge.capabilities.claim.activity.dto.ActivitySummaryDTO
uses edge.capabilities.claim.activity.local.IActivityPlugin

/**
 * Claim activity handler.
 */
class ActivityHandler extends AbstractRpcHandler {
    
  var _activityPlugin : IActivityPlugin
  var _notePlugin : IActivityNotePlugin
  var _noteFormatPlugin : INoteFormatPlugin

  @InjectableNode
  @Param("activityPlugin", "Activity manipulation plugin")
  @Param("notePlugin", "Plugin used for activity notes")
  @Param("noteFormatPlugin", "Plugin used to format notes")
  construct(activityPlugin : IActivityPlugin, notePlugin : IActivityNotePlugin, noteFormatPlugin : INoteFormatPlugin) {
    this._activityPlugin = activityPlugin
    this._notePlugin = notePlugin
    this._noteFormatPlugin = noteFormatPlugin
  }

  /**
   * Retrieves the activity summaries.
   *
   * <dl>
   *   <dt>Calls:</dt>
   *   <dd><code>IActivityPlugin#getSummaries(ActivitySearchDTO)</code> - to return the list of summaries.</dd>
   * </dl>
   *
   * @param activityStatus an array containing the Status of the Activities which the Vendor wishes to view. 
   *                       They are a typelist on Activity.Status
   * @returns Activity summaries. If activityStatus is <code>null</code> or empty then an empty array is returned.
   */ 
  @JsonRpcMethod
  @ApidocMethodDescription("Retrieves the activity summaries.")
  @ApidocAvailableSince("5.0")
  function getActivitySummaries(activityStatus : ActivitySearchDTO) : ActivitySummaryDTO[] {
    return _activityPlugin.getSummaries(activityStatus)
  }
  
  
  
  /**
   * Finds an activity by its public id.
   *
   * <dl>
   *   <dt>Calls:</dt>
   *   <dd><code>IActivityPlugin#toDTO(Activity)</code> - to generate the DTO.</dd>
   * </dl>
   *
   * @param activityID the public id
   * @returns An activity DTO.
   */ 
  @JsonRpcMethod
  @ApidocMethodDescription("Finds an activity by its public id.")
  @ApidocAvailableSince("5.0")
  function getActivity(activityID : String) : ActivityDTO{
    return _activityPlugin.toDTO(_activityPlugin.getActivity(activityID))
  }
  
  
  /**
   * Performs all or nothing duo of actions on an Activity which is associated with a Claim.
   * Firstly, it completes the activity.
   * Secondly, it adds a note to the activity to say the activity has been completed.
   *
   * <dl>
   *   <dt>Calls:</dt>
   *   <dd><code>IActivityPlugin#getActivity(String)</code> - to find the activity.</dd>
   *   <dd><code>IActivityPlugin#toDTO(Activity)</code> - to return the DTO object.</dd>
   *   <dd><code>INoteFormatPlugin#updateFromDTO(Note, NoteDTO)</code> - to update the claim notes with a new note.</dd>
   * </dl>
   *
   * @param activityId the public id of the activity that is to completed
   * @returns the completed activity
   */ 
  @JsonRpcMethod
  @ApidocMethodDescription("Performs all or nothing duo of actions on an Activity which is associated with a Claim..")
  @ApidocAvailableSince("5.0")
  function completeActivity(activityId:String) : ActivityDTO {
    final var activity = _activityPlugin.getActivity(activityId)
    
    if ( activity.Status != ActivityStatus.TC_OPEN ) {
      return _activityPlugin.toDTO(activity)
    }
    
    final var newActivity = Bundle.resolveInTransaction(\ bundle -> {
      final var res = bundle.add(activity)
      
      final var note = activity.Claim.addNote(null, null)
      note.setInitialValues()
      note.Activity = activity
      note.ClaimContact = note.Activity.ExternalOwnerCC
      _noteFormatPlugin.updateFromDTO(note, new NoteDTO(){:Body = "Status changed from Open to Complete",:Subject="Status Change"})
      res.complete()
      return res
    })
    
    return _activityPlugin.toDTO(newActivity)
  }
  



  /**
   * Create a note that is associated with an Activity.
   *
   * <dl>
   *   <dt>Calls:</dt>
   *   <dd><code>IActivityPlugin#getActivity(String)</code> - to find the activity.</dd>
   *   <dd><code>INotePlugin#toDTO(Activity)</code> - to return the DTO object.</dd>
   *   <dd><code>INoteFPlugin#createNote(Activity, NoteDTO)</code> - to create an activity note.</dd>
   * </dl>
   *
   * @param activityId the public id of the activity
   * @param noteDTO The note to be created.
   * @returns A serialized version of the new Note.
   */
  @JsonRpcMethod
  @ApidocMethodDescription("Create a note that is associated with an Activity.")
  @ApidocAvailableSince("5.0")
  function createActivityNote(activityId:String, noteDTO: NoteDTO): NoteDTO {
    var activity = _activityPlugin.getActivity(activityId)
    if ( activity.Status != ActivityStatus.TC_OPEN ) {
      throw new IllegalStateException(){
        :Message = "Notes can't be attached to closed/skipped/cancelled activities",
        :Data = activity.Status
      }
    }
    
    final var res = Bundle.resolveInTransaction(\ bundle -> {
      activity = bundle.add(activity)
      return _notePlugin.createNote(activity, noteDTO)
    })


    return _notePlugin.toDTO(res)
  }
  

  /**
   * Returns notes related to a vendor for a given activity. The activity entity doesn't hold a direct refernce to notes.
   *
   * <dl>
   *   <dt>Calls:</dt>
   *   <dd><code>IActivityPlugin#getActivity(String)</code> - to find the activity.</dd>
   *   <dd><code>INotePlugin#getNotes(Activity)</code> - to return the notes for the given activity.</dd>
   * </dl>
   *
   * @param activityID public id for the activity.
   * @returns activity notes
   */
  @JsonRpcMethod
  @ApidocMethodDescription("Returns notes related to a vendor for a given activity. The activity entity doesn't hold a direct refernce to notes.")
  @ApidocAvailableSince("5.0")
  function getActivityNotes(activityID: String): NoteDTO[] {
    final var activity = _activityPlugin.getActivity(activityID)
    return _notePlugin.getNotes(activity)
  }
}
