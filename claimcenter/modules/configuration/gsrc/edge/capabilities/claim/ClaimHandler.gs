package edge.capabilities.claim

uses edge.capabilities.claim.local.ISampleClaimPlugin
uses edge.capabilities.claim.summary.dto.ClaimSummaryResultDTO
uses edge.capabilities.claim.summary.dto.QueryOptionsDTO
uses edge.doc.ApidocAvailableSince
uses edge.doc.ApidocMethodDescription
uses edge.jsonrpc.AbstractRpcHandler
uses edge.di.annotations.InjectableNode
uses edge.jsonrpc.annotation.JsonRpcMethod
uses edge.capabilities.claim.summary.IClaimSummaryPlugin
uses edge.capabilities.claim.policy.IPolicyPlugin
uses edge.capabilities.claim.policy.dto.PolicyDTO
uses edge.capabilities.claim.details.dto.ClaimDTO
uses edge.capabilities.claim.details.IClaimDetailPlugin
uses edge.capabilities.note.dto.NoteDTO
uses edge.capabilities.claim.notes.IClaimNotePlugin
uses edge.PlatformSupport.Bundle
uses edge.exception.EntityNotFoundException
uses edge.capabilities.claim.activity.dto.ActivitySummaryDTO
uses edge.capabilities.claim.activity.local.IActivityPlugin
uses edge.capabilities.claim.dto.ClaimSearchDTO
uses edge.capabilities.claim.local.IClaimRetrievalPlugin
uses edge.jsonrpc.exception.JsonRpcSecurityException
uses gw.api.system.PLConfigParameters

class ClaimHandler extends AbstractRpcHandler{

  /**
   * Plugin used to retrieve claim content.
   */
  private var _claimRetrievalPlugin : IClaimRetrievalPlugin
  
  
  /**
   * Claim policy plugin.
   */
  private var _policyPlugin : IPolicyPlugin

  private var _claimDetailPlugin : IClaimDetailPlugin
  
  private var _claimNotesPlugin : IClaimNotePlugin
  
  private var _activityPlugin : IActivityPlugin

  private var _sampleClaimPlugin : ISampleClaimPlugin

  @InjectableNode
  @Param("claimRetrievalPlugin", "Plugin used to retrieve claims. That plugin is responsible for checking claim access")
  @Param("policyPlugin", "Plugin to deal with policy information")
  @Param("claimDetailPlugin", "Plugin used to provide detailed claim information")
  @Param("claimNotePlugin", "Plugin used to deal with claim notes")
  @Param("activityPlugin", "Plugin used to fetch claim activities")
  construct(
      claimRetrievalPlugin : IClaimRetrievalPlugin,
      policyPlugin : IPolicyPlugin, 
      claimDetailPlugin : IClaimDetailPlugin, 
      claimNotesPlugin : IClaimNotePlugin, 
      activityPlugin : IActivityPlugin,
      sampleClaimPlugin : ISampleClaimPlugin) {
    this._claimRetrievalPlugin = claimRetrievalPlugin
    this._policyPlugin = policyPlugin
    this._claimDetailPlugin = claimDetailPlugin
    this._claimNotesPlugin = claimNotesPlugin
    this._activityPlugin = activityPlugin
    this._sampleClaimPlugin = sampleClaimPlugin
  }

  /**
   * Returns claims associated with the requested policy numbers, with specified claim status
   * and pagination bounds
   * 
   * <dl>
   *  <dt>Calls:</dt>
   *  <dd><code>IClaimRetrievalPlugin#searchClaims(ClaimSearchDTO</code> - to retrieve the claims.</dd>
   *  <dd><code>IClaimSummaryPlugin#getSummary(Claim)</code> - to map the claim list to a DTO.</dd>
   * </dl>
   *
   * @param req The claim search DTO detailing the search parameters.
   * @param queryOptions Nullable, only the pagination parameters are supported
   * @returns claim summaries
   */
  @JsonRpcMethod
  @ApidocMethodDescription("Returns claims associated with the requested policy numbers, with specified claim status and pagination bounds.")
  @ApidocAvailableSince("5.0")
  function getClaimSummaries(req : ClaimSearchDTO, queryOptions : QueryOptionsDTO) : ClaimSummaryResultDTO {
    return _claimRetrievalPlugin.searchClaims(req, queryOptions)
  }

  /**
   * Get detailed claim information by claim number.
   *
   * <dl>
   *  <dt>Calls:</dt>
   *  <dd><code>IClaimDetailPlugin#toDTO(Claim)</code> - to map the claim to a DTO.</dd>
   *  <dd><code>IClaimRetrievalPlugin#getClaimByNumber(String)</code> - to retrieve the claim.</dd>
   *  <dt>Throws:</dt>
   *  <dd><code>EntityNotFoundException</code> - If the claim doesn't exist</dd>
   * </dl>
   *
   * @param claimNumber The claim number
   * @returns claim details
   */
  @JsonRpcMethod
  @ApidocMethodDescription("Get detailed claim information by claim number.")
  @ApidocAvailableSince("5.0")
  function getClaimDetail(claimNumber : String) : ClaimDTO {
    final var claim = retrieveClaim(claimNumber)
    return _claimDetailPlugin.toDTO(claim)
  }
  
  /**
   * Returns all notes associated with a claim.
   *
   * <dl>
   *  <dt>Calls:</dt>
   *  <dd><code>IClaimRetrievalPlugin#getClaimByNumber(String)</code> - to retrieve the claim.</dd>
   *  <dd><code>IClaimNotesPlugin#getNotes(Claim)</code> - to map the claim notes to an array of NoteDTOs.</dd>
   *  <dt>Throws:</dt>
   *  <dd><code>EntityNotFoundException</code> - If the claim doesn't exist</dd>
   * </dl>
   *
   * @param claimNumber a String representation of the claim number for which the notes should be returned.
   * @returns An ArrayList of NoteDTO's.
   */
  @JsonRpcMethod
  @ApidocMethodDescription("Returns all notes associated with a claim.")
  @ApidocAvailableSince("5.0")
  function getClaimNotes(claimNumber: String): NoteDTO[]{
    final var claim = retrieveClaim(claimNumber)
    return _claimNotesPlugin.getNotes(claim)
  }
  
  
  
  /**
   * Creates a Note which is associated with a claim.
   * 
   * <dl>
   *  <dt>Calls:</dt>
   *  <dd><code>IClaimRetrievalPlugin#getClaimByNumber(String)</code> - to retrieve the claim.</dd>
   *  <dd><code>IClaimNotesPlugin#createClaimNote(Claim, NoteDTO)</code> - to create a new note on the Claim using the DTO.</dd>
   *  <dd><code>IClaimNotesPlugin#toDTO(ClaimNote)</code> - to return the newly created note as a DTO.</dd>
   *  <dt>Throws:</dt>
   *  <dd><code>EntityNotFoundException</code> - If the claim doesn't exist</dd>
   * </dl>
   *
   * @param noteDTO A NoteDTO containing the properties of the Note that will be created.
   * @param claimNumber The claim's claim number.
   * @returns A serialized version of the new Note.
   */ 
  @JsonRpcMethod
  @ApidocMethodDescription("Creates a Note which is associated with a claim.")
  @ApidocAvailableSince("5.0")
  function createClaimNote(claimNumber:String, noteDTO: NoteDTO): NoteDTO{
    var claim = retrieveClaim(claimNumber)
    final var note = Bundle.resolveInTransaction(\ b -> {
      claim = b.add(claim)
      return _claimNotesPlugin.createClaimNote(claim, noteDTO)
    })
    return _claimNotesPlugin.toDTO(note)
  }
  
      
  /**
   * Updates a claim note. Used for adjudicator notes.
   *
   * <dl>
   *  <dt>Calls:</dt>
   *  <dd><code>IClaimRetrievalPlugin#getClaimByNumber(String)</code> - to retrieve the claim.</dd>
   *  <dd><code>IClaimNotesPlugin#updateClaimNote(Claim, NoteDTO)</code> - to update the relevant ClaimNote</dd>
   *  <dd><code>IClaimNotesPlugin#toDTO(ClaimNote)</code> - to return the updated ClaimNote as a DTO</dd>
   *  <dt>Throws:</dt>
   *  <dd><code>EntityNotFoundException</code> - If the claim doesn't exist</dd>
   * </dl>
   *
   * @param claimNumber number of the claim for the note.
   * @param dto The note that contains the update information.
   * @returns updated note.
   */
  @JsonRpcMethod
  @ApidocMethodDescription("Updates a claim note. Used for adjudicator notes.")
  @ApidocAvailableSince("5.0")
  function updateClaimNote(claimNumber: String, dto:NoteDTO): NoteDTO {
    var claim = retrieveClaim(claimNumber)
    final var note = Bundle.resolveInTransaction(\ b -> {
      claim = b.add(claim)
      return _claimNotesPlugin.updateClaimNote(b.add(claim), dto)
    })
    
    return _claimNotesPlugin.toDTO(note)
  }
  
  /**
   * Deletes a claim note. Used for adjudicator notes.
   * 
   * <dl>
   *  <dt>Calls:</dt>
   *  <dd><code>IClaimRetrievalPlugin#getClaimByNumber(String)</code> - to retrieve the claim.</dd>
   *  <dd><code>IClaimNotesPlugin#deleteClaimNote(Claim, String)</code> - to delete the claim note.</dd>
   *  <dt>Throws:</dt>
   *  <dd><code>EntityNotFoundException</code> - If the claim doesn't exist</dd>
   * </dl>
   *
   * @param claimNumber number of the claim for the note.
   * @param noteId note identifier.
   */
  @JsonRpcMethod
  @ApidocMethodDescription("Deletes a claim note. Used for adjudicator notes.")
  @ApidocAvailableSince("5.0")
  function deleteClaimNote(claimNumber: String, noteId : String) {
    var claim = retrieveClaim(claimNumber)
    Bundle.transaction(\ bundle -> {
      claim = bundle.add(claim)
      _claimNotesPlugin.deleteClaimNote(bundle.add(claim), noteId)
    })
  }
  


  
  /**
   * Gets a detailed policy object based on a claim number, returns null if no policy is found.
   *
   * <dl>
   *  <dt>Calls:</dt>
   *  <dd><code>IClaimRetrievalPlugin#getClaimByNumber(String)</code> - to retrieve the claim.</dd>
   *  <dd><code>IPolicyPlugin#toDTO(Policy)</code> - to map the policy to a DTO.</dd>
   *  <dt>Throws:</dt>
   *  <dd><code>EntityNotFoundException</code> - If the claim doesn't exist</dd>
   * </dl>
   *
   * @param claimNumber The claim number
   * @returns The matching policy as a PolicyDTO. Returns null if no policy are found.
   */
  @JsonRpcMethod
  @ApidocMethodDescription("Gets a detailed policy object based on a claim number, returns null if no policy is found.")
  @ApidocAvailableSince("5.0")
  public function getClaimPolicyDetail(claimNumber : String) : PolicyDTO {
    final var claim = retrieveClaim(claimNumber)
    return _policyPlugin.toDTO(claim.Policy)
  }


  /**
   * Returns activities associated with a claim.
   * <dl>
   *  <dt>Calls:</dt>
   *  <dd><code>IClaimRetrievalPlugin#getClaimByNumber(String)</code> - to retrieve the claim.</dd>
   *  <dd><code>IActivityPlugin#getClaimSummaries(Claim)</code> - to map the claim activities to an array of ActivitySummaryDTOs.</dd>
   *  <dt>Throws:</dt>
   *  <dd><code>EntityNotFoundException</code> - If the claim doesn't exist</dd>
   * </dl>
   * @param claimNumber the claim number
   * @returns an array of activity summaries
   */ 
  @JsonRpcMethod
  @ApidocMethodDescription("Returns activities associated with a claim.")
  @ApidocAvailableSince("5.0")
  function getClaimActivities(claimNumber : String) : ActivitySummaryDTO[]{
    final var claim = retrieveClaim(claimNumber)
    return _activityPlugin.getClaimSummaries(claim)
  }

  /**
   * Creates a sample claim based on a given policy number.
   * Throws JsonRpcSecurityException if EnableInternalDebugTools flag is disabled.
   * Currently supports sample claims generation for PA and HO policies
   *
   * <dl>
   *  <dt>Calls:</dt>
   *  <dd><code>SampleClaimPlugin#createSampleClaimForPolicy(String,String)</code> - to create sample claim.</dd>
   *  <dd><code>ClaimDetailPlugin#toDto(Claim)</code> - to return the DTO.</dd>
   *  <dt>Throws:</dt>
   *  <dd><code>JsonRpcSecurityException</code> - If EnableInternalDebugTools flag is disabled</dd>
   *  <dd><code>UnsupportedOperationException</code> - When a policy number of a policy with unsupported type is given</dd>
   * </dl>
   *
   * @param policyNumber Unique number of policy
   * @param claimState possible values are open,draft,closed,archive
   * @returns Sample claim as ClaimDTO.
   */
  @JsonRpcMethod
  @ApidocMethodDescription("Creates sample claim for a given policy, based on the requested state.")
  @ApidocAvailableSince("9.0")
  function createSampleClaimForPolicy(policyNumber: String, claimState: String): ClaimDTO {
    if (!PLConfigParameters.EnableInternalDebugTools.getValue()) {
      throw new JsonRpcSecurityException()
    }
    return _sampleClaimPlugin.createSampleClaimForPolicy(policyNumber, ClaimState.get(claimState))
  }

  /**
   * Retrieves a claim. Throws EntityNotFoundException if claim was not found.
   */
  private function retrieveClaim(claimNumber : String) : Claim {
    final var claim = _claimRetrievalPlugin.getClaimByNumber(claimNumber)
    if(claim == null){
      throw new EntityNotFoundException(){
        :Message = "No Claim entity found",
        :Data = claimNumber
      }
    }
    return claim
  }
}
