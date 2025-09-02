package edge.servlet.jsonrpc.marshalling

uses com.fasterxml.jackson.databind.DeserializationContext
uses com.fasterxml.jackson.databind.deser.std.StdValueInstantiator

uses java.lang.Class
uses java.lang.Throwable
uses java.lang.RuntimeException
uses java.io.IOException
uses com.fasterxml.jackson.databind.node.TreeTraversingParser
uses edge.jsonrpc.exception.JsonRpcInvalidParamsException
uses gw.lang.reflect.IType
uses gw.lang.reflect.TypeSystem
uses gw.lang.reflect.ITypeInfo
uses gw.lang.reflect.TypeSystem

class TypeKeyInstantiator extends StdValueInstantiator {
  var _typeList: gw.entity.ITypeList
  construct(typeKeyName: String) {
    super(null, null as Class)
    if (typeKeyName.equals("ClasslessTypeKey")){ //We do not have sufficient information from Type until runtime
      _typeList = null
    } else {
      var t = TypeSystem.getByFullNameIfValid("typekey.${typeKeyName}")
      if ( t typeis gw.entity.ITypeList ) {
        _typeList = t
      }
    }
  }

  override function canCreateFromString(): boolean {
    return true
  }

  override function createFromString(ctxt: DeserializationContext, value: String): Object {
    var typekey : Object
    if (_typeList == null) { // ClasslessTypeKey was supplied, we must figure out the key at runtime via the owning class
      var currentValue = ctxt.Parser.CurrentValue
      var dto : IType //DTO being deserialized
      var field : String //Field on DTO we are instantiating
      var typelistDef : IType // The typelist
      if (currentValue == null){ //Typekey may be part of a collection or list, examine parent for more information
        var parentParser =  ctxt.Parser.getParsingContext().Parent
        dto = TypeSystem.getByFullNameIfValid(parentParser.CurrentValue.Class.Name)
        field = parentParser.CurrentName
        var typelistField = dto.TypeInfo.Properties.firstWhere( \ elt -> elt.Name.equalsIgnoreCase(field)).FeatureType
        typelistDef = typelistField.ComponentType
      } else {
        dto = TypeSystem.getByFullNameIfValid(ctxt.Parser.CurrentValue.Class.Name)
        field = ctxt.Parser.CurrentName
        typelistDef = dto.TypeInfo.Properties.firstWhere( \ elt -> elt.Name.equalsIgnoreCase(field)).FeatureType
      }

      var t = TypeSystem.getByFullNameIfValid(typelistDef.Name)
      if ( t typeis gw.entity.ITypeList ) {
       typekey = t.getTypeKey(value)
      } else {
        throw new RuntimeException("Unsupported typelist class "+ t)
      }
    } else {
      typekey =_typeList.getTypeKey(value)
    }
    if (typekey == null){
      throw new JsonRpcInvalidParamsException(new Throwable("Could not deserialize typecode " + value + " for typelist " + _typeList));
    }
    return typekey
  }
}
