package edge.servlet.jsonrpc

interface IVerifyCaptcha {
  function verify(captchaResponse : String): boolean
}
