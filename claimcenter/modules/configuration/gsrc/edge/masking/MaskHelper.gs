package edge.masking

uses edge.masking.annotation.Masked
uses gw.lang.reflect.IPropertyInfo

uses java.lang.reflect.Field

class MaskHelper {

  public static final var DTO_FIELDS_MAPPER: String = "dtoMapper"
  public static final var ENT_FIELDS_MAPPER : String = "entMapper"

  static function mapFields(ent: Object, dto: Object, mapper: Map<String, Map<String, String>>) : Object {

    var properties = (typeof dto).TypeInfo.getProperties()

    for (prop in properties) {
      var annotations = prop.Annotations;
      for (ann in annotations) {
        var propMap = mapper.get(DTO_FIELDS_MAPPER).get(prop.getName())
        var dtoField : Field
        var dtoFieldValue: Object
        if (propMap != null) {
          dtoField = dto.Class.getDeclaredField(propMap)
          dtoField.setAccessible(true)
          dtoFieldValue = dtoField.get(dto)
          if ((ann.getType() == Masked) && ((ann.Instance as Masked).pattern() == dtoFieldValue)) {
            var getMethod = ent.Class.getMethod(mapper.get(ENT_FIELDS_MAPPER).get(prop.getName()))
            var entValue = getMethod.invoke(ent)
            dtoField.set(dto, entValue)
          }
        }
      }
    }
    return dto
  }

    static function removeMaskedArgs(typedArgs: List<Object>): Map<Object, Map<String, String>> {
      var typedArgsMaskNull = new ArrayList<Object>(typedArgs)
      var maskedFields = new HashMap<Object, Map<String, String>>()
      for(arg in typedArgsMaskNull) {
        setValueForMaskFields(arg, maskedFields)
      }
      return maskedFields
    }

    static private function setValueForMaskFields(obj: Object, maskedFields: Map<Object, Map<String, String>>):void {
      var properties = (typeof obj).TypeInfo.getProperties()
      for (prop in properties) {
        if (isDtoObject(prop.Type.getName())) {
          var field = getField("_" + Character.toLowerCase(prop.getName().charAt(0)) + prop.getName().substring(1), obj.Class)
          if (field != null) {
            setValueForMaskFields(getFieldValue(field, obj), maskedFields)
          }
        } else {
          var maskValue = getMaskedAnnotation(prop)
          if ( maskValue != null) {
            var field = getField("_" + Character.toLowerCase(prop.getName().charAt(0)) + prop.getName().substring(1), obj.Class)
            if ((field != null) && (maskValue == getFieldValue(field, obj))) {
              addMaskedField(maskedFields, obj, field.getName(), maskValue)
              setFieldValue(field, obj, null)
            }
          }
        }
      }
    }

    static private function isDtoObject(objName: String): boolean {
      return objName.endsWith("DTO")
    }

    static private function getField(name: String, type: Class): Field {
      var fields = getAllFields(new HashMap<java.lang.String, java.lang.reflect.Field>(), type)
      return fields.get(name)
    }

    static private function getAllFields(fields: Map<String, Field>, type: Class): Map<String, Field> {
      for(field in type.getDeclaredFields()){
        fields.put(field.getName(), field)
      }
      if (type.getSuperclass() != null) {
        getAllFields(fields, type.getSuperclass())
      }
      return fields
    }

    static private function getMaskedAnnotation(prop: IPropertyInfo): String {
      for (ann in prop.getAnnotations()) {
        if (ann.getType() == Masked) {
          return (ann.Instance as Masked).pattern()
        }
      }
      return null
    }

    static private function getFieldValue(field: Field, obj: Object): Object {
      field.setAccessible(true)
      return field.get(obj)
    }

    static private function setFieldValue(field: Field, obj: Object, value: Object) {
      field.setAccessible(true)
      field.set(obj, value)
    }

    static private function addMaskedField(maskedFields: Map<Object, Map<String, String>>, obj: Object, fieldName: String, maskValue: String) {
      var mf = maskedFields.get(obj)
      if(mf == null) {
        mf = new HashMap<String, String>()
      }
      mf.put(fieldName, maskValue)
      maskedFields.put(obj, mf)
    }

    static function restoreMaskValues(maskedFields: Map<Object, Map<String, String>>) {
      for(obj in maskedFields.keySet()) {
        for(fieldName in maskedFields.get(obj).keySet()) {
          var field = getField(fieldName, obj.Class)
          setFieldValue(field, obj, maskedFields.get(obj).get(fieldName))
        }
      }
    }
}
