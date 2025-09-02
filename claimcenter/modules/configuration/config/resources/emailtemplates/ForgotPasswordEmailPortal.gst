<%@ params( email: String, portalURL: String, code: String ) %>

  Hi ${email}, <br />
  Open the following url to reset your password: <br />
  <a href="${portalURL}?token=${code}">Reset Password</a><br /><br />

  Cheers,

