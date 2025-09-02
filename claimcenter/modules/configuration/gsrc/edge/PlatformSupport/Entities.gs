package edge.PlatformSupport

/**
 * Provides helper functions to work with entities.
 */
class Entities {
   public static function getEntityById(entityType : String, id: String): Object{
     final var objType = gw.lang.reflect.TypeSystem.getByFullNameIfValid("entity." + entityType) as Type // Get the Type for the entity
     return gw.api.database.Query.make(objType).compare("PublicID", Equals, id).select().AtMostOneRow // Find the entity based on the publicID
   }
}
