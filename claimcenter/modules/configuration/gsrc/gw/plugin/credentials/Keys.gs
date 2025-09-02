package gw.plugin.credentials

/**
 * This has keys that surepath supplied code uses to extract credentials from {@link gw.plugin.credentials.impl.CredentialsPlugin}
 *
 * Note that this source file was originally created by the surepath group, along with a credentials.xml for local use.  The
 * keys are used in production with the AWS Secrets sourced CredentialsPlugin used in production.  Instead of forcing the customers
 * to use the credential plugin, the logic provided by {@link wsi.remote.gw.GWInterAppConfigurationProvider} uses the
 * credential plugin if provided and has the key, otherwise in lower planets (and locally) it will default to the su/gw.
 */
@Export
public final class Keys {
  public static final var SUITE_AB_INTEGRATION : String = "suite.ab.integration"
  public static final var SUITE_BC_INTEGRATION : String = "suite.bc.integration"
  public static final var SUITE_PC_INTEGRATION : String = "suite.pc.integration"
  public static final var SUITE_CC_INTEGRATION : String = "suite.cc.integration"
  private construct() {
  }
}