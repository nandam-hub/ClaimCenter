package edge.uaaoperations.uaaclient.dto

uses edge.jsonmapper.JsonProperty
uses java.lang.Long

class TokenResponseDTO {

  @JsonProperty
  private var _accessToken: String as access_token

  @JsonProperty
  private var _tokenType: String as token_type

  @JsonProperty
  private var _expiresIn: Long as expires_in

  @JsonProperty
  private var _scope: String as scope

  @JsonProperty
  private var _jti: String as jti
  
  override function toString(): String {
    return "access_token: ${access_token}, token_type: ${token_type}, expires_in: ${expires_in}, scope: ${scope}, jti: ${jti}"
  }
 }
