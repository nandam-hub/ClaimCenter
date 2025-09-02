package edge.jsonrpc.endpoint.validation

uses edge.aspects.model.factory.INodeFactory
uses edge.aspects.validation.ValidationAspect
uses edge.aspects.ancestors.AncestorChain
uses edge.aspects.model.ModelUtil
uses java.util.ArrayList
uses edge.aspects.model.ModelNode
uses edge.aspects.validation.context.ContextAspect

/** Validator for one argument instance. */
final class BaseArgumentValidator extends ArgumentValidator {

  /** Name of the argument. */
  private var _argName : String

  /** Factory for the validation aspect. */
  private var _aspectFactory : INodeFactory<Object, ValidationAspect>

  internal construct(name : String, af : INodeFactory<Object, ValidationAspect>) {
    this._aspectFactory = af
    this._argName = name
  }

  /** Validates an object. */
  override public function validate(ctx : ContextAspect, value : Object) : List<ArgumentValidationError> {
    final var model = _aspectFactory.createNode(ctx, AncestorChain.emptyChain(), value)
    final var errors = ModelUtil.preOrderAggregate(
          new ArrayList<ArgumentValidationError>(),
          model,
          \agg, node -> agg.addAll(getNodeErrors(node)))

    return errors
  }

  /** Returns  a list of errors for the node. */
  private function getNodeErrors(node : ModelNode<ValidationAspect>) : List<ArgumentValidationError> {
    final var fullPath = node.Ancestors.Empty ? "" : node.Ancestors.first().PathToCurrent.AsString

    return node.Meta.ValidationMessages.map( \ msg ->
      new ArgumentValidationError(_argName, fullPath, msg))
  }
}
