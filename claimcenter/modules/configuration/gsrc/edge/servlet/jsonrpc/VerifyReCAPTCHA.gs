package edge.servlet.jsonrpc

uses gw.lang.reflect.json.Json
uses org.apache.http.HttpHeaders
uses org.apache.http.NameValuePair
uses org.apache.http.client.entity.UrlEncodedFormEntity
uses org.apache.http.client.methods.HttpPost
uses org.apache.http.impl.client.CloseableHttpClient
uses org.apache.http.impl.client.HttpClients
uses org.apache.http.message.BasicNameValuePair
uses org.apache.http.util.EntityUtils

class VerifyReCAPTCHA implements IVerifyCaptcha {
  private final var url : String = "https://www.google.com/recaptcha/api/siteverify";

  function verify(captchaResponse : String) : boolean {
    if (captchaResponse.isEmpty()) {
      return false;
    }

    var httpPost = new HttpPost(url)

    var params = new ArrayList<NameValuePair>()
    params.add(new BasicNameValuePair("secret", ScriptParameters.CaptchaSecret))
    params.add(new BasicNameValuePair("response", captchaResponse))
    httpPost.setEntity(new UrlEncodedFormEntity(params))
    httpPost.setHeader(HttpHeaders.CONTENT_TYPE, "application/x-www-form-urlencoded")

    using (var client = HttpClients.createDefault()) {
      var response = client.execute(httpPost)
      var entity = response.getEntity()
      var responseString = EntityUtils.toString(entity, "UTF-8")
      var responseObject : Dynamic = Json.fromJson(responseString)
      return responseObject.get("success")
    }
  }
}
