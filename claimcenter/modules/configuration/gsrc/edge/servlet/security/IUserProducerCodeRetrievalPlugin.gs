package edge.servlet.security

uses java.lang.String

/**
 * Retrieves producer codes available for a user.
 */
interface IUserProducerCodeRetrievalPlugin {
   function getUserProducerCodes(user: String) :  List<String>
}
