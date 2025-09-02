package edge.metadata.annotation

uses java.lang.annotation.Target
uses java.lang.annotation.ElementType

/**
 * Marker for the metadata generation method for the type property. Only static properties should be annotated with
 * this annotation. The method have to provide a simple value - one metadata aspect which would be encoded as the
 * metadata.
 */
@Target({ElementType.METHOD, ElementType.FIELD})
final class MetaFactory implements  IAnnotation {
}
