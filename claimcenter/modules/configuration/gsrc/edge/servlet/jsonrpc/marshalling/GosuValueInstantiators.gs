package edge.servlet.jsonrpc.marshalling

uses com.fasterxml.jackson.databind.BeanDescription
uses com.fasterxml.jackson.databind.DeserializationConfig
uses com.fasterxml.jackson.databind.deser.ValueInstantiator
uses com.fasterxml.jackson.databind.module.SimpleValueInstantiators

uses java.lang.Class
uses java.util.HashMap
uses java.util.Map

class GosuValueInstantiators extends SimpleValueInstantiators {
  var _typeKeyInstantiators: Map<String, TypeKeyInstantiator>
  construct() {
    _typeKeyInstantiators = new HashMap<String, TypeKeyInstantiator>()
  }

  override function findValueInstantiator(config: DeserializationConfig, beanDesc: BeanDescription, defaultInstantiator: ValueInstantiator): ValueInstantiator {
    var beanClass = beanDesc.BeanClass
    if ((gw.entity.TypeKey.Type as Class).isAssignableFrom(beanClass)) {
      var instantiator = _typeKeyInstantiators.get(beanClass.Name)
      if (instantiator == null) {
        instantiator = new TypeKeyInstantiator(beanClass.SimpleName)
        _typeKeyInstantiators.put(beanClass.Name, instantiator)
      }
      return instantiator
    } else {
      return defaultInstantiator
    }
  }
}
