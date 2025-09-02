package edge.security.authorization

interface GrantedAuthoritiesPlugin {

  function addGrantedAuthority(authority: Authority)

  function addGrantedAuthority(authority: Authority, userName: String)

  function removeGrantedAuthority(authority: Authority)

  function removeGrantedAuthority(authority: Authority, userName: String)

  function getGrantedAuthorities(userName: String) : Authority[]

}
