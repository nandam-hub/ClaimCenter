package edge.capabilities.helpers

uses edge.exception.EntityNotFoundException
uses edge.security.authorization.AuthorityType
uses java.lang.IllegalArgumentException
uses edge.PlatformSupport.Logger
uses edge.PlatformSupport.Reflection
uses edge.security.EffectiveUser
uses edge.security.authorization.exception.AuthorizationException

/**
 * Provides helper functions to retrieve Account entities
 *
 * This class is included in the diamond and emerald platform packages but is excluded
 * from carbon as ClaimCenter carbon does not have the concept of Account.
 * The file needs to be added to the carbon location for the PolicyCenter and BillingCenter
 * backend modules and excluded from ClaimCenter carbon
 */
class AccountUtil {

  final private static  var LOGGER = new Logger(Reflection.getRelativeName(AccountUtil))

  /**
   * Verify if an Account exist using the given AccountNumber
   *
   * @param anAccountNumber An unique identifying AccountNumber for the desired Account.
   * @return A boolean indicating if the account exist or not
   */
  @Param("anAccountNumber", "An unique identifying AccountNumber for the desired Account.")
  @Returns("A boolean indicating if the account exist or not")
  public static function accountExists(anAccountNumber: String): Boolean {
    if (anAccountNumber == null || anAccountNumber.Empty) {
      throw new IllegalArgumentException("Account number is null or empty")
    }
    return gw.api.database.Query.make(entity.Account).compare("AccountNumber", Equals, anAccountNumber).select().AtMostOneRow != null
  }

  /**
   * Find an Account using the given AccountNumber.
   *
   * @param anAccountNumber An unique identifying AccountNumber for the desired Account.
   * @return The Account with the given AccountNumber.
   * @throws EntityNotFoundException If an Account cannot be found with the given AccountNumber.
   */
  @Param("anAccountNumber", "An unique identifying AccountNumber for the desired Account.")
  @Returns("The Account with the given AccountNumber")
  @Throws(EntityNotFoundException, "If an Account cannot be found with the given AccountNumber.")
  public static function getAccountByAccountNumber(anAccountNumber: String): Account {
    if (anAccountNumber == null || anAccountNumber.Empty){
      throw new IllegalArgumentException("Account number is null or empty")
    }
    var anAccount = gw.api.database.Query.make(entity.Account).compare("AccountNumber", Equals, anAccountNumber).select().AtMostOneRow

    if(anAccount == null){
      throw new EntityNotFoundException(){
          : Message = "No Account found",
          : Data = anAccountNumber
      }
    }

    return anAccount
  }

  /**
   * Gets a unique account for the user.
   *
   * @throws AuthorizationException If user have no unique platform account.
   */
  public static function getUniqueAccount(effectiveUser: EffectiveUser) : Account {
    final var uniqueAccountId = effectiveUser.getUniqueTarget(AuthorityType.ACCOUNT);

    return getAccountByAccountNumber(uniqueAccountId);
  }

  /**
   * Gets a list of associated accounts for the user.
   *
   */
  public static function getAssociatedAccounts(effectiveUser: EffectiveUser) : List<Account> {
    final var accountIds = effectiveUser.getTargets(AuthorityType.ACCOUNT);
    return accountIds.map(\accountId -> {
      try {
        return getAccountByAccountNumber(accountId)
      } catch (e: EntityNotFoundException ) {
        return null as Account
      }
    }).where(\elt -> elt != null)
  }

  /**
   * Verify user has account.
   */
  public static function verifyAccountForEffectiveUser(effectiveUser: EffectiveUser, account : Account) {
    final var accountIds = effectiveUser.getTargets(AuthorityType.ACCOUNT);

    if (!accountIds.hasMatch(\accountId -> account.AccountNumber == accountId)) {
      throw new AuthorizationException(){:Message = "User is not authorized to access unique authority of the type: ACCOUNT"}
    }
  }
}
