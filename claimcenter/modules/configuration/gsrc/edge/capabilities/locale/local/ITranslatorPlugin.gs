package edge.capabilities.locale.local

uses java.util.Map

interface ITranslatorPlugin {
  function translate(keys: List<String>): Map<String, String>
}
