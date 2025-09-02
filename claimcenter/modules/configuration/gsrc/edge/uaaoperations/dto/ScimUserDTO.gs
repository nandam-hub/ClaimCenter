package edge.uaaoperations.dto

uses java.util.Set

uses edge.aspects.validation.annotations.Required
uses edge.aspects.validation.annotations.Size
uses edge.jsonmapper.JsonProperty
uses java.util.ArrayList
uses edge.aspects.validation.annotations.Email

class ScimUserDTO extends ScimBase {

  construct() {}

  construct(_id: String, _userName: String, _givenName: String, _familyName: String) {
    super(_id)
    this.userName = _userName
    this.name = new Name(_givenName, _familyName)
    this.emails = new ArrayList<EmailAddress>()
  }

  static final class Group {

    @JsonProperty
    private var value:String as Value

    @JsonProperty
    private var display:String as Display

    public static enum Type {
      DIRECT, INDIRECT
    }

    @JsonProperty
    private var type:Type as Type

    construct() {
      this(null, null)
    }

    construct(_value:String, _display:String) {
      this(_value, _display, Type.DIRECT)
    }

    construct(_value: String, _display:String, _type: Type) {
      this.value = _value
      this.display = _display
      this.type = _type
    }


    override function hashCode(): int {
      var prime = 31
      var result = 1
      result = prime * result + ((display == null) ? 0 : display.hashCode())
      result = prime * result + ((value == null) ? 0 : value.hashCode())
      result = prime * result + ((type == null) ? 0 : type.hashCode())
      return result
    }

    override function equals(obj: Object): boolean {
      if (this === obj) {
        return true
      }
      if (obj == null) {
        return false
      }
      if (obj typeis Group) {
        if (display != obj.Display) {
          return false
        }
        if (value != obj.Value) {
          return false
        }
        if (type != obj.Type) {
          return false
        }
        return true

      } else {
        return false
      }
    }

    override function toString(): String {
      return "(id: ${value}, name: ${display}, type: ${type})"
    }
  }

  static final class Name {
    @JsonProperty @Size(1, 60) @Required
    private var familyName : String as FamilyName

    @JsonProperty @Size(1, 60) @Required
    private var givenName : String as GivenName

    construct() {}

    construct(_givenName: String, _familyName: String) {
      this.givenName = _givenName
      this.familyName = _familyName
    }
  }

  static final class EmailAddress {
    @JsonProperty @Required @Email
    private var value : String as Value

    @JsonProperty
    private var primary: boolean as Primary = false

    @JsonProperty
    private var type: String as Type

    construct() {}

    construct(_value: String, _primary: boolean,_type: String) {
      this.value = _value
      this.primary = _primary
      this.type = _type
    }
  }

  static final class PhoneNumber {
    @JsonProperty
    private var value : String as Value

    @JsonProperty
    private var type: String as Type

    construct() {}

    construct(_value: String, _type: String) {
      this.value = _value
      this.type = _type
    }
  }

  @JsonProperty
  private var userName: String as UserName

  @JsonProperty
  private var name: Name as Name

  @JsonProperty
  private var password: String as Password

  @JsonProperty
  private var groups: Set<Group> as Groups

  @JsonProperty
  private var emails: List<EmailAddress> as Emails

  @JsonProperty
  private var phoneNumbers: List<PhoneNumber> as PhoneNumbers

  @JsonProperty
  private var displayName: String as Display

  @JsonProperty
  private var nickName: String as NickName

  @JsonProperty
  private var profileUrl: String as ProfileUrl

  @JsonProperty
  private var title: String as Title

  @JsonProperty
  private var userType: String as UserType

  @JsonProperty
  private var preferredLanguage: String as PreferredLanguage

  @JsonProperty
  private var locale: String as Locale

  @JsonProperty
  private var timezone: String as Timezone

  @JsonProperty
  private var active:Boolean as Active  = true

  @JsonProperty
  private var verified:Boolean as Verified = true

  @JsonProperty
  private var origin:String as Origin = ""

  @JsonProperty
  private var zoneId: String as ZoneId = null

  @JsonProperty
  private var salt: String as Salt = null
//
//  @JsonProperty
//  private var passwordLastModified:Date as PasswordLastModified = null
}
