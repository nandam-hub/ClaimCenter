package edge.di.boot

uses edge.di.Path
uses edge.di.CapabilityAndPath
uses java.io.File

uses edge.di.solver.RuleDefn
uses edge.util.properties.EdgePropertiesConstants
uses edge.util.properties.EdgePropertiesUtil
uses gw.util.Pair

uses java.util.Properties
uses edge.util.either.Either
uses java.util.Collections
uses edge.di.solver.goals.Goal
uses edge.di.solver.goals.PathGoal
uses edge.di.solver.goals.TypeGoal
uses java.lang.Exception
uses gw.api.util.ConfigAccess
uses edge.PlatformSupport.Reflection
uses edge.PlatformSupport.Logger
uses gw.lang.reflect.IType
uses gw.lang.reflect.TypeSystem
uses java.util.regex.Pattern

/**
 * Application bootstrapper. Loads configuration files and provides overall data specification.
 */
final class ConfigBoot {

  final private static var LOGGER = new Logger(Reflection.getRelativeName(ConfigBoot))

  construct() {

  }

  static function loadPortalConfiguration() : Either<List<String>, PortalConfig> {
    final var data = loadCapabilities(ConfigAccess.getConfigFile(EdgePropertiesConstants.EDGE_PROPERTIES_LOCATION))
    if (data.isLeft) {
      data.left.each( \ item -> LOGGER.logError(item))
    }
    return data
  }

  /** Loads capability configuration from filesystem respecting
   * configuration type (customer or gw-specific).
   * Returns list of error along with portal configuration data.
   */
  public static function loadCapabilities(configRoot : File) : Either<List<String>, PortalConfig> {
    final var fileResults = configRoot.listFiles().toList().map(\f -> loadRuleFile(f))

    return Either.reduceList(fileResults)
      .mapLeft(\errs -> errs.flatten().toList())
      .mapRight(\confs -> PortalConfig.combine(confs))
  }



  private static function loadRuleFile(file : File) : Either<List<String>, PortalConfig> {
    final var name = file.Name

    if (name.endsWith(EdgePropertiesConstants.GW_PROPERTIES_SUFFIX)) {
      final var rules = loadGWProperties(
          name.substring(0, name.length - EdgePropertiesConstants.GW_PROPERTIES_SUFFIX.length),
          file,
          \ s -> parsePrivateGoal(s))
      return rules.mapRight( \ privRules -> new PortalConfig(Collections.emptyList(), privRules))
    }

    if (name.endsWith(EdgePropertiesConstants.CUSTOM_PROPERTIES_SUFFIX)) {
      final var rules = loadGWProperties(
          name.substring(0, name.length - EdgePropertiesConstants.CUSTOM_PROPERTIES_SUFFIX.length),
              file,
              \ s -> parseGoal(s))
      return rules.mapRight( \ pubRules -> new PortalConfig(pubRules, Collections.emptyList()))
    }

    return Either.right(PortalConfig.EMPTY)
  }


  /**
   * Loads a gw-private rules.
   */
  private static function loadGWProperties(
        cap : String,
        file : File,
        goals(spec : String): Either<String, Goal>) : Either<List<String>, List<Pair<CapabilityAndPath, RuleDefn>>> {

    final var errPrefix = cap + "::" + file + ": "
    final var src = "Config file " + file

    var result: Either<String, Properties>
    try {
      var properties = EdgePropertiesUtil.loadPropertiesFromFile(file)
      result = Either.right<String, Properties>(properties)
    } catch (e) {
      result = Either.left<String, Properties>("Failed to load " + file + ":" + e.toString())
    }
    return result
      .mapLeft(\err -> Collections.singletonList(errPrefix + err))
      .mmapRight(\props ->
        parseRules(src, cap, props, goals)
          .mapLeft(\errs -> errs.map(\err -> errPrefix + err))
      )
  }


  private static function parseRules(
        src : String,
        cap : String,
        rules : Properties,
        goals(tgt : String) : Either<String, Goal>)
      : Either<List<String>, List<Pair<CapabilityAndPath, RuleDefn>>> {
    final var parsedGoals =
      rules.entrySet()
        .map(\entry ->
           goals(entry.Value.toString())
              .mapLeft(\err -> "Bad rule for " + entry.Key + ": " + err)
              .mapRight(\goal -> createRuleDefn(src, cap, entry.Key.toString(), goal))
        )
    return Either.reduceList(parsedGoals)
  }


  private static function createRuleDefn(src : String, cap : String, pth : String, goal : Goal) : Pair<CapabilityAndPath, RuleDefn> {
    if (pth.startsWith("forallcapabilitynodes->")) {
      var typeName = pth.remove("forallcapabilitynodes->")
      var wildcardType: IType
      var pattern = Pattern.compile("(.+)<(.+)>")
      var matcher = pattern.matcher(typeName)
      if (matcher.matches())  {
        var classType = TypeSystem.getByFullNameIfValid(matcher.group(1))
        var paramType = TypeSystem.getByFullNameIfValid(matcher.group(2))
        wildcardType = TypeSystem.findParameterizedType(classType, paramType)
      } else {
        wildcardType = TypeSystem.getByFullNameIfValid(typeName)
      }
      return Pair.make(
          new CapabilityAndPath(cap, wildcardType),
              new RuleDefn(src, goal)
      )
    }
    return Pair.make(
      new CapabilityAndPath(cap, Path.parse(pth)),
      new RuleDefn(src, goal)
    )
  }


  private static function parsePrivateGoal(goal : String) : Either<String, Goal> {
    return parseGoal(goal).mmapRight(\ res -> {
      if (res typeis PathGoal) {
        return Either.left<String, Goal>("Reference goals are not supported for internal config")
      }
      return Either.right<String, Goal>(res)
    })
  }

  private static function parseGoal(goal : String) : Either<String, Goal> {
    goal = goal.trim()
    if (goal.startsWith("ref ")){
      return Either.right<String, Goal>(new PathGoal(Path.parse(goal.substring("ref ".length()).trim())))
    }
    try {
      return Either.right<String, Goal>(new TypeGoal(TypeSystem.getByFullNameIfValid(goal)))
    } catch (e : Exception) {
      LOGGER.logError(e)
      return Either.left<String, Goal>("Bad goal " + goal + " : " + e)
    }
  }
}
