package edge.capabilities.claim.activity.local
uses edge.di.annotations.ForAllGwNodes
uses gw.api.database.Query
uses edge.security.authorization.AuthorityType
uses edge.capabilities.claim.contact.IClaimContactPlugin
uses edge.exception.EntityNotFoundException
uses edge.util.mapping.Mapper
uses edge.security.authorization.IAuthorizerProviderPlugin
uses edge.security.authorization.Authorizer
uses edge.capabilities.claim.activity.dto.ActivityDTO
uses edge.capabilities.claim.activity.dto.UserDTO
uses edge.capabilities.claim.activity.dto.ActivitySearchDTO
uses edge.capabilities.claim.activity.dto.ActivitySummaryDTO

/**
 * Default implementation of activity manipulation plugin.
 */
class DefaultActivityPlugin implements IActivityPlugin {


  private var _contactPlugin : IClaimContactPlugin

  private var _mapper : Mapper as readonly Mapper

  private var _activityAuthz : Authorizer<Activity> as readonly ActivityAuthorizer

  @ForAllGwNodes
  @Param("contactPlugin", "Contact manipulation plugin")
  construct(contactPlugin : IClaimContactPlugin,authzProvider:IAuthorizerProviderPlugin) {
    this._contactPlugin = contactPlugin
    this._mapper = new Mapper(authzProvider)
    this._activityAuthz = authzProvider.authorizerFor(Activity)
  }


  override function getSummaries(req : ActivitySearchDTO) : ActivitySummaryDTO[] {
    final var items = searchActivities(req)
    return Mapper.mapArray(items, \ a -> toSummaryDTO(a))
  }



  override function getClaimSummaries(claim : Claim) : ActivitySummaryDTO[] {
    return Mapper.mapArray(claim.Activities,\ a -> toSummaryDTO(a))
  }



  override function getActivity(activityId : String) : Activity {
    final var activity = Query.make(Activity).compare("PublicID",Equals,activityId).select().AtMostOneRow
    if (activity == null || !Mapper.hasAccess(activity)) {
      throw new EntityNotFoundException(){
          :Message = "No Activity entity found"
      }
    }
    return activity
  }



  /**
   * Converts activity into activity details DTO.
   */
  override function toDTO(activity : Activity) : ActivityDTO {
    final var res = new ActivityDTO()
    fillBaseProperties(res, activity)
    res.AssignedBy = userToDTO(activity.AssignedByUser)
    res.Insured = _contactPlugin.toContactDTO(
        activity.Claim.Policy.getClaimContactByRole(ContactRole.TC_INSURED))
    return res
  }



  /**
   * Converts activity into the summary DTO.
   */
  protected function toSummaryDTO(activity : Activity) : ActivitySummaryDTO {
    final var res = new ActivitySummaryDTO()
    fillBaseProperties(res, activity)
    res.AssignedBy = userToDTO(activity.AssignedByUser)
    res.Insured = _contactPlugin.toContactDTO(
        activity.Claim.Policy.getClaimContactByRole(ContactRole.TC_INSURED))
    res.isClaimVisible =  activity.Claim.getClaimContact(activity.ExternalOwner).Roles.hasMatch( \ elt1 -> elt1.Role == ContactRole.TC_VENDOR)
    return res
  }



  /**
   * Converts user into user dto.
   */
  protected function userToDTO(user : User) : UserDTO {
    if (user == null) {
      return null
    }

    final var res = new UserDTO()
    fillBaseProperties(res, user)
    return res
  }



  /**
   * Searches for all activities matching request.
   */
  protected function searchActivities(req : ActivitySearchDTO) : Activity[] {

    final var vendorUids = _activityAuthz.UserProvider.EffectiveUser.getTargets(AuthorityType.VENDOR)
    if (vendorUids.Empty) {
      return {}
    }
    return Query
        .make(Activity)
        .compareIn("Status", req.Statuses)
        .join("ExternalOwnerCC").join("Contact")
        .compareIn("AddressBookUID", vendorUids.toTypedArray())
        .select().toTypedArray()
  }


  /**
   * Fills base properties on the activity details.
   */
  public static function fillBaseProperties(dto : ActivityDTO, activity : Activity) {
    dto.PublicID = activity.PublicID
    dto.Subject = activity.Subject
    dto.Mandatory = activity.Mandatory
    dto.Recurring = activity.Recurring
    dto.Priority = activity.Priority
    dto.Status = activity.Status
    dto.ClaimNumber = activity.Claim.ClaimNumber
    dto.Description = activity.Description
    dto.DueDate = activity.TargetDate
    dto.CompletedDate = activity.CloseDate
    dto.EscalationDate = activity.EscalationDate
    dto.Importance = activity.Importance
  }



  /**
   * Fills base properties on the activity DTO.
   */
  public static function fillBaseProperties(dto : ActivitySummaryDTO, activity : Activity) {
    dto.PublicId = activity.PublicID
    dto.Subject = activity.Subject
    dto.Priority = activity.Priority
    dto.Status = activity.Status
    dto.ClaimNumber = activity.Claim.ClaimNumber
    dto.DueDate = activity.TargetDate
  }



  /**
   * Fills base properties on the user DTO.
   */
  public static function fillBaseProperties(dto : UserDTO, user : User) {
    dto.FirstName = user.Contact.FirstName
    dto.LastName = user.Contact.LastName
    dto.PublicID = user.PublicID
  }
}
