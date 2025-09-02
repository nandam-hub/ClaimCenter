package gw.surepath.suite.integration.preupdate

uses com.google.common.collect.Ordering
uses gw.api.preupdate.PreUpdateContext
uses gw.api.util.ConfigAccess
uses gw.lang.reflect.IType
uses gw.lang.reflect.TypeSystem
uses gw.plugin.InitializablePlugin
uses gw.plugin.preupdate.IPreUpdateHandler
uses gw.surepath.suite.integration.logging.StructuredLogger

uses java.io.File

/**
 * IPreUpdateHandler implementation
 * Reads direct files of directories defined in the plugin params
 * All classes found that implement the PrioritizedPreUpdateHandler are added to a pool ordered by Priority to be executed during the executePreUpdate function
 */
class SurePathPreUpdateHandler implements IPreUpdateHandler, InitializablePlugin {

  private static final var _logger = StructuredLogger.PLUGIN

  private static final var CONFIG_BASE = ConfigAccess.getConfigFile("gsrc/")
  private static final var PACKAGE_KEY_START = "surepath.preupdate."

  private var _blocks : TreeMap<PrioritizedPreUpdateHandler<KeyableBean>, Type<KeyableBean>>
  private var _insertedTypes : HashSet<Type<KeyableBean>>
  private var _updatedTypes : HashSet<Type<KeyableBean>>
  private var _removedTypes : HashSet<Type<KeyableBean>>

  private final var _assignableMap = new HashMap<Type, HashMap<Type, Boolean>>()

  override function executePreUpdate(preUpdateContext : PreUpdateContext) {
    var insertedBeans = new HashMap<Type<KeyableBean>, List<KeyableBean>>()
    var updatedBeans = new HashMap<Type<KeyableBean>, List<KeyableBean>>()
    var removedBeans = new HashMap<Type<KeyableBean>, List<KeyableBean>>()

    for (bean in preUpdateContext.InsertedBeans) {
      checkTypes(insertedBeans, _insertedTypes, bean)
    }
    for (bean in preUpdateContext.UpdatedBeans) {
      checkTypes(updatedBeans, _updatedTypes, bean)
    }
    for (bean in preUpdateContext.RemovedBeans) {
      checkTypes(removedBeans, _removedTypes, bean)
    }
    if (!insertedBeans.Empty || !updatedBeans.Empty || !removedBeans.Empty) {
      executePreUpdate(insertedBeans, updatedBeans, removedBeans)
    }
  }

  private function executePreUpdate(final insertedBeans : Map<Type, List<KeyableBean>>,
                                    final updatedBeans : Map<Type, List<KeyableBean>>,
                                    final removedBeans : Map<Type, List<KeyableBean>>) {
    _logger.debug("executePreUpdate called", null, {"Inserted count" -> (insertedBeans.Count as String), "Updated count" -> (updatedBeans.Count as String), "Removed count" -> (removedBeans.Count as String)})
    _logger.debug("Going through PreUpdateExecutors", null, {"PreUpdateExecutor Count" -> (_blocks.Count as String)})
    _blocks.eachKeyAndValue(\k, val -> combineTypesAndExecute(k, val, insertedBeans, updatedBeans, removedBeans))
    _logger.debug("Finished executing PreUpdateExecutors")
  }

  private function combineTypesAndExecute(final ex : PrioritizedPreUpdateHandler,
                                          final type : Type,
                                          final insertedBeans : Map<Type, List<KeyableBean>>,
                                          final updatedBeans : Map<Type, List<KeyableBean>>,
                                          final removedBeans : Map<Type, List<KeyableBean>>) {
    var c = new ArrayList<KeyableBean>()
    if (ex.Inserted && insertedBeans.get(type).HasElements) {
      c.addAll(insertedBeans.get(type))
    }
    if (ex.Updated && updatedBeans.get(type).HasElements) {
      c.addAll(updatedBeans.get(type))
    }
    if (ex.Removed && removedBeans.get(type).HasElements) {
      c.addAll(removedBeans.get(type))
    }
    if (c.HasElements) {
      ex.executePreUpdate(c)
    }
  }

  private function checkTypes(final map : Map<Type, List<KeyableBean>>, final types : Set<Type<KeyableBean>>, final bean : KeyableBean) {
    for (t in types) {
      checkType(map, t, bean)
    }
  }

  private function checkType(final map : Map<Type, List<KeyableBean>>, final type : Type<KeyableBean>, final bean : KeyableBean) {
    _assignableMap.putIfAbsent(type.Type, new HashMap<gw.lang.reflect.Type, Boolean>())
    var parentAssignableMap = _assignableMap.get(type.Type)
    var childIsAssignable = parentAssignableMap.get(bean.IntrinsicType) ?: type.Type.isAssignableFrom(bean.IntrinsicType)
    parentAssignableMap.putIfAbsent(bean.IntrinsicType, childIsAssignable)
    if (childIsAssignable) {
      map.putIfAbsent(type.Type, new ArrayList<KeyableBean>())
      map.get(type.Type).add(bean)
    }
  }

  private function parseFileName(filename : String) : String {
    if (filename.contains(".")) {
      return filename.substring(0, filename.indexOf("."))
    }
    return filename
  }

  override property set Parameters(map : Map<Object, Object>) {
    _logger.info("SurePathPreUpdateHandler.setParameters - Setting initial parameters...")

    _blocks = new TreeMap<PrioritizedPreUpdateHandler<KeyableBean>, Type<KeyableBean>>(new Ordering<PrioritizedPreUpdateHandler>() {
      override function compare(a : PrioritizedPreUpdateHandler, b : PrioritizedPreUpdateHandler) : int {
        var result = (a.Priority ?: PreUpdatePriority.lowest).Ordinal - (b.Priority ?: PreUpdatePriority.lowest).Ordinal
        if (result == 0) {
          result = a.Class.Name.compareTo(b.Class.Name)
        }
        return result
      }
    })

    _insertedTypes = new HashSet<Type<KeyableBean>>()
    _updatedTypes = new HashSet<Type<KeyableBean>>()
    _removedTypes = new HashSet<Type<KeyableBean>>()

    var processed = new HashSet<String>()
    map.eachKeyAndValue(\k, val -> {
      var key = k as String
      if (key.startsWith(PACKAGE_KEY_START)) {
        var packageName = (val as String).trim()
        recursePackage(packageName, processed)
      }
    })
    _logger.info("SurePathPreUpdateHandler.setParameters - Completed setting initial parameters.")
  }

  function recursePackage(packageName : String, processed : HashSet<String>) {
    var queue = new LinkedList<String>() as Queue<String>
    queue.add(packageName)
    while (!queue.isEmpty()) {
      var currentPackage = queue.poll()
      if (!processed.contains(currentPackage)) {
        new File(CONFIG_BASE, currentPackage.replaceAll("\\.", "/"))?.listFiles().each(\file -> {
          if (file.isFile() && file.Extension == 'gs') {
            _logger.debug("Checking file", {file.Name})
            var className = "${currentPackage}.${parseFileName(file.Name)}"
            var type = TypeSystem.getByFullName(className)
            if (!type.Interface && PrioritizedPreUpdateHandler.Type.isAssignableFrom(type)) {
              _logger.debug("Parsing file", {className})
              var instance = type.TypeInfo.getConstructor({}).Constructor.newInstance({}) as PrioritizedPreUpdateHandler
              var beanType = type.TypeInfo.Methods.firstWhere(\i -> !i.Static && i.Parameters.Count == 1 && i.Name.startsWith("executePreUpdate("))
                  .Parameters.first().FeatureType.TypeParameters.first()
              addToBlocks(instance, beanType, currentPackage, file.Name)
              _logger.info("Finished adding Preupdate Executor", {className}, null, #recursePackage(String, HashSet<String>))
            }
          } else if (file.isDirectory()) {
            queue.add(currentPackage + '.' + file.Name)
          }
        })
        processed.add(currentPackage)
      }
    }
  }

  private function addToBlocks(instance : PrioritizedPreUpdateHandler, beanType : IType, group : String, id : String) : boolean {
    _blocks.put(instance, beanType)
    if (instance.Inserted) {
      _insertedTypes.add(beanType)
    }
    if (instance.Updated) {
      _updatedTypes.add(beanType)
    }
    if (instance.Removed) {
      _removedTypes.add(beanType)
    }
    _logger.debug("PrioritizedPreUpdateHandler added.", {instance, beanType, group, id})
    return true
  }
}