package gw.surepath.cc.configuration.activitymanagement.dto

uses gw.surepath.suite.configuration.annotation.IncludeInDocumentation
uses gw.xml.ws.annotation.WsiExportable

/**
 * Activity Management: Data Transfer Object for representing the current state of a supplied Activity
 */
@WsiExportable("http://guidewire.com/cc/ws/gw/surepath/cc/configuration/activitymanagement/dto/ActivityDTO")
@Export
@IncludeInDocumentation
final class ActivityDTO {
  private var _type           : String as ActivityType
  private var _patternCode    : String as PatternCode
  private var _subject        : String as Subject
  private var _description    : String as Description
  private var _status         : String as ActivityStatus
  private var _priority       : String as Priority
  private var _dueDate        : Date as DueDate
  private var _escalationDate : Date as EscalationDate
  private var _assignedUser : String as AssignedUser

  /**
   * Create a new ActivityDTO that represents the current state of the supplied Activity.
   * @param that The Activity to be represented.
   * @return an ActivityDTO object instance
   */
  @IncludeInDocumentation
  static function valueOf(that : Activity) : ActivityDTO {
    return new ActivityDTO().readFrom(that)
  }

  /**
   * Make this constructor private to force usage of the valueOf(Activity) function to instantiate this object
   */
  @IncludeInDocumentation
  private construct() {

  }

  /**
   * Set the fields in this DTO using the supplied Activity
   * @param that The Activity to copy from.
   */
  @IncludeInDocumentation
  final function readFrom(that : Activity) : ActivityDTO {

    ActivityType = that.Type.Code
    PatternCode = that.ActivityPattern?.Code
    Subject = that.Subject
    Description = that.Description
    ActivityStatus = that.Status.Code
    Priority = that.Priority.Code
    DueDate = that.TargetDate
    EscalationDate = that.EscalationDate
    AssignedUser = that.AssignedUser.toString()

    return this
  }
}