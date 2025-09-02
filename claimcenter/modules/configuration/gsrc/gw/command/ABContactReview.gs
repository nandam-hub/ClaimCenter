package gw.command

uses com.guidewire.pl.system.dependency.PLDependencies
uses com.guidewire.pl.system.integration.plugins.PluginDefBase
uses com.guidewire.pl.system.integration.plugins.PluginDefGosu
uses gw.api.util.DisplayableException
uses gw.plugin.Plugins
uses gw.plugin.contact.IContactReviewPlugin

uses java.util.Map

@DefaultMethod("setPlugin")
@Export
class ABContactReview extends BaseCommand {

  public static final var AB5040_PLUGIN : String = "ab5040"
  public static final var AB5000_PLUGIN : String = "ab5000"
  public static final var AB1000_PLUGIN : String = "ab1000"
  public static final var AB900_PLUGIN : String = "ab900"

  private static final var _pluginConfig = PLDependencies.getPluginConfig()
  private static final var _authMap : Map<String, String> = {
    "username" -> "ClientAppCC",
    "password" -> "gw"
  }

  private static final var _ab5040Plugin = PluginDefGosu.newGosuPluginDef(IContactReviewPlugin, "gw.plugin.spm.ab5040.ContactReviewPlugin", _authMap)
  private static final var _ab5000Plugin = PluginDefGosu.newGosuPluginDef(IContactReviewPlugin, "gw.plugin.spm.ab5000.ContactReviewPlugin", _authMap)
  private static final var _ab1000Plugin = PluginDefGosu.newGosuPluginDef(IContactReviewPlugin, "gw.plugin.spm.ab1000.ContactReviewPlugin", _authMap)
  private static final var _ab900Plugin = PluginDefGosu.newGosuPluginDef(IContactReviewPlugin, "gw.plugin.spm.ab900.ContactReviewPlugin", _authMap)
  private static final var _default : String = "default"

  private static final var _abPluginMap : Map<String, PluginDefBase> = {
    AB5040_PLUGIN -> _ab5040Plugin,
    AB5000_PLUGIN -> _ab5000Plugin,
    AB1000_PLUGIN -> _ab1000Plugin,
    AB900_PLUGIN -> _ab900Plugin,
    _default -> _ab900Plugin
   }

  construct() { }

  @Argument("impl", {ABContactReview.AB900_PLUGIN, ABContactReview.AB1000_PLUGIN, ABContactReview.AB5000_PLUGIN, ABContactReview.AB5040_PLUGIN})
  function setPlugin() : String {
    var arg = getArgumentAsString("impl")
    if (arg == null) {
      arg = AB900_PLUGIN
    }
    var pluginImpl = _abPluginMap.get(arg)
    if (pluginImpl == null) {
      throw new DisplayableException("Unrecognized plugin type: ${arg}")
    }
    _pluginConfig.addPluginDef(pluginImpl)
    return "Using ${Plugins.get(IContactReviewPlugin)}"
  }
  
}
