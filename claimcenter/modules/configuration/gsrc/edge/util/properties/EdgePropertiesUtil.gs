package edge.util.properties

uses gw.api.util.ConfigAccess

uses java.io.BufferedInputStream
uses java.io.File
uses java.io.FileInputStream
uses java.io.InputStreamReader
uses java.util.ArrayList
uses java.util.Properties

class EdgePropertiesUtil {

  public static property get EdgePropertiesList(): List<File> {
    var result = new ArrayList<File>()
    var configFiles = ConfigAccess.getConfigFile(EdgePropertiesConstants.EDGE_PROPERTIES_LOCATION)
    configFiles.eachFileInTree(\file -> {
      if (file.Name.endsWith(EdgePropertiesConstants.GW_PROPERTIES_SUFFIX) or file.Name.endsWith(EdgePropertiesConstants.CUSTOM_PROPERTIES_SUFFIX)) {
        result.add(file)
      }
    })
    return result
  }

  public static function loadPropertiesFromFile(file: File): Properties {
    using (var is = new FileInputStream(file), var bis = new BufferedInputStream(is), var reader = new InputStreamReader(bis, "UTF-8")) {
      final var properties = new Properties()
      properties.load(reader)
      return properties
    }
  }
}
