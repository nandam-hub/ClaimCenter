package gw.icd

@Export
public class ICDSearchCriteria implements gw.lang.reflect.gs.IGosuObject, java.io.Serializable {

  /**
   * Filter Fields
   */
  var _icdCode : String as ICDCode
  var _description : String as Description
  var _icdbodySystem : ICDBodySystem as ICDBodySystem
  var _icdEdition : ICDEdition as ICDEdition
  var _activeDate : Date as ActiveDate

  /**
   * Default Constructor
   */
  construct() {
    _icdCode = null
    _description = null
    _icdbodySystem = null
    _icdEdition = null
    _activeDate = null
  }

  /**
   * Clears out all the filter variables
   */

  function clear() {
    _icdCode = null
    _description = null
    _icdbodySystem = null
    _icdEdition = null
    _activeDate = null
  }

}