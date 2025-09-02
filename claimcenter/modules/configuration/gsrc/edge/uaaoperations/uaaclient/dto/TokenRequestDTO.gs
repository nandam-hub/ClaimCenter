package edge.uaaoperations.uaaclient.dto

uses edge.jsonmapper.JsonProperty

class TokenRequestDTO {

 construct(clientId: String, clientSecret: String) {
   client_id = clientId
   client_secret = clientSecret
   grant_type = "client_credentials"
   token_format = "opaque"
   response_type = "token"
 }

 @JsonProperty
 private var _client_id: String as client_id

 @JsonProperty
 private var _client_secret: String as client_secret

 @JsonProperty
 private var _grant_type: String as grant_type

 @JsonProperty
 private var _token_format: String as token_format

 @JsonProperty
 private var _response_type: String as response_type

}
