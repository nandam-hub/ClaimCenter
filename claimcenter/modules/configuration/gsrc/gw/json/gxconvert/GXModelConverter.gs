package gw.json.gxconvert

uses com.guidewire.modules.ConfigFileAccess
uses com.guidewire.pl.json.base.JsonValidationException
uses com.guidewire.pl.json.builder.JsonMappingBuilder
uses com.guidewire.pl.json.builder.JsonMappingMapperBuilder
uses com.guidewire.pl.json.builder.JsonSchemaBuilder
uses com.guidewire.pl.json.builder.JsonSchemaBuilderFactory
uses com.guidewire.pl.json.builder.JsonSchemaDefinitionBuilder
uses com.guidewire.pl.json.mapping.JsonMappingImpl
uses com.guidewire.pl.json.schema.Converter
uses com.guidewire.pl.json.schema.JsonSchemaImpl
uses com.guidewire.pl.json.util.JsonFileUtil
uses com.guidewire.pl.system.expression.GosuExpression

uses com.guidewire.simplexml.SimpleXmlNode
uses gw.api.json.schema.FormattedJsonType
uses gw.api.json.schema.NativeJsonType
uses gw.internal.gosu.parser.Symbol
uses gw.lang.parser.StandardSymbolTable
uses gw.lang.reflect.TypeSystem
uses gw.pl.util.FileUtil

uses java.io.File
uses java.nio.file.FileVisitResult
uses java.nio.file.Files
uses java.nio.file.Path
uses java.nio.file.SimpleFileVisitor
uses java.nio.file.attribute.BasicFileAttributes

@SuppressWarnings("HiddenPackageReference")
@Export
public class GXModelConverter {

  construct() {
    // Necessary for finding configurations directories for schema/mapping
    ConfigFileAccess.initIfNecessary()
  }

  private var _modelFiles : Map<String, File>
  private var _modelNames : Map<String, String>
  private var _processed : Set<File>
  private var _toProcess : Set<File>
  private var _schemaBuilder : JsonSchemaBuilder
  private var _mappingBuilder : JsonMappingBuilder

  /**
   * Converts a list of GX models into a single JSON schema and mapping pair, named after the first GX model in the provided list
   * @param fileNames List of GX model paths relative to modules/configuration/gsrc
   * @param schemaVersion The version for the generated schema and mapping files
   * @return The generated schema and mapping files containg all the converted GX models
   */
  static public function convertGxModelsToJsonSchema(fileNames : String[], schemaVersion : String) : File[] {
    return convertGxModelsToJsonSchema(fileNames, null, schemaVersion)
  }

  /**
   * Converts a list of GX models into a single JSON schema and mapping pair
   * @param fileNames List of GX model paths relative to modules/configuration/gsrc
   * @param genFileName The relative path and base name of the generated schema/mapping files,
   * if null the schema and mapping are named after the first GX model in the provided list
   * @param schemaVersion The version for the generated schema and mapping files
   * @return The generated schema and mapping files containg all the converted GX models
   */
  static public function convertGxModelsToJsonSchema(fileNames : String[], genFileName : String, schemaVersion : String) : File[] {
    return convertGxModelsToJsonSchema("modules/configuration/gsrc", fileNames, genFileName, schemaVersion)
  }

  /**
   * Converts a list of GX models into a single JSON schema and mapping pair
   * @param rootDirName the relative in the distribution
   * @param fileNames List of GX model paths relative to modules/configuration/src
   * @param genFileName The relative path and base name of the generated schema/mapping files,
   * if null the schema and mapping are named after the first GX model in the provided list
   * @param schemaVersion The version for the generated schema and mapping files
   * @return The generated schema and mapping files containg all the converted GX models
   */
  static public function convertGxModelsToJsonSchema(rootDirName : String, fileNames : String[], genFileName : String, schemaVersion : String) : File[] {
    if (fileNames.IsEmpty) {
      return null
    }

    var rootDir = new File(rootDirName)
    var files = new ArrayList<File>()
    fileNames.each(\fileName -> files.add(new File(rootDir, fileName)))
    if (genFileName == null) {
      genFileName = fileNames[0].replace(".gx","")
    }
    var schemaName = convertFileNameToSchemaName(genFileName)
    var gxModelConverter = new GXModelConverter()
    gxModelConverter.doConversion(files, rootDir, schemaName, schemaVersion)
    var fqn = JsonFileUtil.getFullyQualifiedName(schemaName, schemaVersion)
    var schemaOutput = JsonFileUtil.getFileForSchema(fqn)
    FileUtil.write(schemaOutput, gxModelConverter._schemaBuilder.prettyPrint())
    var mappingOutput = JsonFileUtil.getFileForMapping(fqn)
    FileUtil.write(mappingOutput, gxModelConverter._mappingBuilder.prettyPrint())
    return new File[] { schemaOutput, mappingOutput }
  }

  private function doConversion(rootModels : List<File>, srcRoot : File, schemaName : String, schemaVersion : String) {
    findModelFiles(srcRoot)
    _schemaBuilder = JsonSchemaBuilderFactory.create(schemaName, schemaVersion)
    _mappingBuilder = new JsonMappingBuilder(JsonFileUtil.getFullyQualifiedName(schemaName, schemaVersion), schemaName, schemaVersion)
    _processed = new HashSet<File>()
    _toProcess = new LinkedHashSet<File>()
    _toProcess.addAll(rootModels)
    drainQueue()
  }

  private static function convertFileNameToSchemaName(s : String) : String {
      return s.replace("/",".").replace("\\",".");
  }

  private function findModelFiles(srcRoot : File) {
    _modelNames = new HashMap<String, String>()
    _modelFiles = new HashMap<String, File>()
    Files.walkFileTree(srcRoot.toPath(), new SimpleFileVisitor<Path>(){
      @SuppressWarnings("unused")
      @Override
      override function visitFile(file : Path, attrs : BasicFileAttributes) : FileVisitResult {
        if (file.getFileName().toString().endsWith(".gx")) {
          var modelName = srcRoot.toPath().relativize(file).toString().replace('/', '.').replace('\\', '.')
          modelName = modelName.substring(0, modelName.length() - 3)
          _modelNames.put(modelName.toLowerCase(), modelName)
          _modelFiles.put(modelName.toLowerCase(), file.toFile())
        }
        return super.visitFile(file, attrs)
      }
    })
  }

  private function drainQueue() {
    while (!_toProcess.isEmpty()) {
      // Copy _toProcess so we're not iterating it as we add to it
      var temp = new LinkedHashSet<File>(_toProcess)
      temp.forEach(\f -> processFile(f))
      _toProcess.removeAll(temp)
      _processed.addAll(temp)
    }
  }

  private function addToQueue(f : File) {
    if (f != null && !_processed.contains(f) && !_toProcess.contains(f)) {
      _toProcess.add(f)
    }
  }

  private function processFile(file : File) {
    var rootNode = SimpleXmlNode.parse(file)
    processNode(rootNode)
  }

  private function processNode(node : SimpleXmlNode) {
    var rootType = node.getAttribute("type")
    var fileName = node.getParseLocation().getPath().getFileName().toString()
    var schemaDefinitionName = fileName.substring(0, fileName.indexOf('.'))

    var typeBuilder = _schemaBuilder.withDefinition(schemaDefinitionName)
    var mapperBuilder = _mappingBuilder.withMappingMapper(schemaDefinitionName).withRoot(rootType)

    var includes = node.getChild("includes")
    includes.getChildren().forEach(\n -> processInclude(rootType, n, typeBuilder, mapperBuilder))
  }

  private function processInclude(rootType : String, include : SimpleXmlNode, typeBuilder : JsonSchemaDefinitionBuilder, mapperBuilder : JsonMappingMapperBuilder) {
    var path = include.getAttribute("path")
    var type = include.getAttribute("type")
    var model = include.getAttribute("model")

    processPath(typeBuilder, mapperBuilder, rootType, path, type, model)
  }

  private function processPath(typeBuilder : JsonSchemaDefinitionBuilder, mapperBuilder : JsonMappingMapperBuilder, rootType : String, path : String, leafType : String, leafModel : String) {
    var symbolName = rootType.substring(rootType.lastIndexOf('.') + 1)

    var midArrayIndex = path.indexOf("[].")
    if (midArrayIndex == -1) {
      createPropertyForPath(typeBuilder, mapperBuilder, symbolName, path, leafType, leafModel)
    } else {
      var rootPath = path.substring(0, midArrayIndex)
      var restOfPath = path.substring(midArrayIndex + 3)
      var propertyName = getPropertyName(rootPath)
      var intermediateSchemaName = typeBuilder.getName() + "_" + propertyName
      var rootPathType = determinePathType(rootType, rootPath)
      if (_schemaBuilder.getTypeBuilder(intermediateSchemaName) == null) {
        createIntermediateBaseTypeBuilders(typeBuilder, mapperBuilder, propertyName, intermediateSchemaName, symbolName + "." + rootPath, rootPathType)
      }
      var subPathTypeBuilder = _schemaBuilder.getTypeBuilder(intermediateSchemaName)
      var subPathMapperBuilder = _mappingBuilder.getMappingMapper(intermediateSchemaName)

      processPath(subPathTypeBuilder, subPathMapperBuilder, rootPathType, restOfPath, leafType, leafModel)
    }
  }

  private function determinePathType(rootType : String, path : String) : String {
    if (path.startsWith("(")) {
      var lastParen = path.indexOf(')')
      rootType = path.substring(1, lastParen).replace('-', '.')
      path = path.substring(lastParen + 2)
    }
    var gosuExpression = new GosuExpression("Root." + path)
    var symbolTable = new StandardSymbolTable()
    symbolTable.putSymbol(new Symbol("Root", TypeSystem.getByFullName(rootType), null as Object))
    var expressionType = gosuExpression.getType(symbolTable)
    if (expressionType.isArray()) {
      return expressionType.getComponentType().getName()
    } else {
      return expressionType.getName()
    }
  }

  private function createIntermediateBaseTypeBuilders(definitionBuilder : JsonSchemaDefinitionBuilder, 
                                                      mapperBuilder : JsonMappingMapperBuilder, 
                                                      propertyName : String, 
                                                      schemaDefinitionName : String, 
                                                      path : String, 
                                                      pathType : String) {
    // Add in the property linking the containing type to this intermediate type
    definitionBuilder.withProperty(propertyName).withArrayRef(JsonSchemaImpl.getDefinitionStanzaImpl() + schemaDefinitionName)
    mapperBuilder.withProperty(propertyName).withPath(path).withMapper(JsonMappingImpl.getMapperStanzaImpl() + schemaDefinitionName)

    // Add in a schema definition and mapping builder for the intermediate type these intermediate types will then have
    // additional properties added to them
    _schemaBuilder.withDefinition(schemaDefinitionName)
    _mappingBuilder.withMappingMapper(schemaDefinitionName).withRoot(pathType)
  }

  private function createPropertyForPath(typeBuilder : JsonSchemaDefinitionBuilder, mapperBuilder : JsonMappingMapperBuilder, symbolName : String, path : String, type : String, model : String) {
    var typePredicate : String = null
    if (path.startsWith("(")) {
      var lastParen = path.indexOf(')')
      typePredicate = path.substring(1, lastParen).replace('-', '.')
      path = path.substring(lastParen + 2)
    }

    var propertyName = getPropertyName(path)
    var pathRoot = (typePredicate == null ? symbolName : "(" + symbolName + " as " + typePredicate + ")")
    var propertyBuilder = typeBuilder.withProperty(propertyName)
    var mappingPropertyBuilder = mapperBuilder
            .withProperty(propertyName)
            .withPath(pathRoot + "." + (path.endsWith("[]") ? path.substring(0, path.length() - 2) : path))
    if (model == null) {
      var jsonType = objectToJsonType(type)
      if (path.endsWith("[]")) {
        propertyBuilder.withArrayType(jsonType)
      } else {
        propertyBuilder.withFormattedType(jsonType)
      }
    } else {
      var properModelName = _modelNames.get(model.toLowerCase())
      if (properModelName == null) {
        properModelName = model
        System.out.println(">>> Unresolved reference to " + model)
      }
      addToQueue(_modelFiles.get(model.toLowerCase()))
      var typeName = properModelName.substring(properModelName.lastIndexOf('.') + 1)
      mappingPropertyBuilder.withMapper(JsonMappingImpl.getMapperStanzaImpl() + typeName)
      if (path.endsWith("[]")) {
        propertyBuilder.withArrayRef(JsonSchemaImpl.getDefinitionStanzaImpl() + typeName)
      } else {
        propertyBuilder.withObjectRef(JsonSchemaImpl.getDefinitionStanzaImpl() + typeName)
      }
    }
    if (typePredicate != null) {
      mappingPropertyBuilder.withPredicate(symbolName + " typeis " + typePredicate)
    }
  }

  private function objectToJsonType(typeName : String) : FormattedJsonType {
    var iType = TypeSystem.getByFullNameIfValid(typeName)
    if (iType == null) {
      return new FormattedJsonType(NativeJsonType.string, "unknown", typeName)
    }

    try {
      return Converter.getDefaultMappingForIType(iType)
    } catch (e : JsonValidationException) {
      // If we can't figure out what to do with the type, map it as a string with unknown format, but keep it in the output
      return new FormattedJsonType(NativeJsonType.string, "unknown", typeName)
    }
  }

  private function getPropertyName(path : String) : String {
    if (path.startsWith("(")) {
      var lastParen = path.indexOf(')')
      path = path.substring(lastParen + 2)
    }
    return path.replace('.', '_').replaceAll("\\[\\]", "")
  }
}
