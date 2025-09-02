package edge.metadata.annotation

uses java.lang.annotation.Target
uses java.lang.annotation.ElementType

/**
 * Marker for the multi-metadata generation method. Only static properties should be annotated with
 * this annotation. The method have to provide an array of values - representations of the generated metadata items.
 */
@Target({ElementType.METHOD, ElementType.FIELD})
final class MetaMultiFactory implements  IAnnotation {
}
