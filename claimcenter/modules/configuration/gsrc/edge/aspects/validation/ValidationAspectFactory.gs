package edge.aspects.validation

uses edge.aspects.model.factory.IAspectFactory
uses edge.aspects.validation.augment.Augmentable
uses edge.aspects.model.ModelNode
uses edge.util.lazy.LazyUtil
uses edge.aspects.model.ModelUtil
uses edge.aspects.validation.augment.AugmentFactory
uses edge.aspects.validation.validity.ValidityRuleFactory
uses edge.aspects.validation.requiredness.RequirednessFactory
uses edge.aspects.validation.context.ContextFactory
uses java.util.Collections
uses edge.aspects.validation.context.ContextAspect

/**
 * Factory for the validation aspect.
 */
internal final class ValidationAspectFactory implements IAspectFactory<ContextAspect, ValidationAspect> {

  /** Requiredness factory. */
  private var _requiredness : AugmentFactory<RequirednessFactory>

  /** Ruleset factory. */
  private var _rules : AugmentFactory<ValidityRuleFactory>

  /** Context factory. */
  private var _context : ContextFactory


  construct(
        re : AugmentFactory<RequirednessFactory>,
        ru : AugmentFactory<ValidityRuleFactory>,
        ct : ContextFactory) {
    this._requiredness = re
    this._rules = ru
    this._context = ct
  }


  override function createAspectFor(ctx : ContextAspect, node: ModelNode<ValidationAspect>): ValidationAspect {
    final var nodeValue = node.Value
    final var parentValue = node.Parent?.Value

    final var context = _context.createContext(node.Parent == null ? ctx : node.Parent.Meta.Context, {nodeValue, parentValue})

    final var validationArguments = new Object[]{nodeValue, parentValue, context}

    final var requiredness =
        _requiredness.createAugmentable(validationArguments)

    /* Do not run rules on null values, run them for non-nulls only.
     * Yes, it is a trick and have to be refactored later.
     */
    final var validity =
      nodeValue == null ?
        Augmentable.createEmpty(new ValidityRuleFactory(Collections.emptyList())) :
        _rules.createAugmentable(validationArguments)

    final var validationMessages = getMessages(requiredness, validity, node,  validationArguments)

    final var subtreeValid = LazyUtil.theadUnsafe( \-> isSubtreeValid(node))
    return new ValidationAspect(requiredness, validity, validationMessages, subtreeValid, context)
  }


  /** Checks if subtree is valid. */
  private function isSubtreeValid(node : ModelNode<ValidationAspect>) : boolean {
    return node.Meta.IsValid && ModelUtil.getChildren(node).allMatch(\ child -> child.Meta.IsValid)
  }


  /** Returns messages for the node. */
  private function getMessages(
      requiredness : Augmentable<RequirednessFactory>,
      rules : Augmentable<ValidityRuleFactory>,
      node : ModelNode<ValidationAspect>,
      validationArguments : Object[])
      : List<String> {
    return getNewMessages(requiredness, rules, node, validationArguments)
  }

  /** Returns messages for the node. Uses new message evaluation algorithm. */
  private function getNewMessages(
        requiredness : Augmentable<RequirednessFactory>,
        rules : Augmentable<ValidityRuleFactory>,
        node : ModelNode<ValidationAspect>,
        validationArgs : Object[])
      : List<String> {

    final var factories = Augmentable.collectWithNode(requiredness, node, \x -> x.Requiredness)
    final var requirements = factories.flatMap( \ elt -> elt.Second.getRequiredness(validationArgs))

    if (node.Value == null) {
      return requirements
         .where( \ rule -> rule.Requires)
         .map( \ elt -> elt.StatusMismatchMessage)
    }

    final var reqMessages = requirements
        .where( \ rule -> rule.Hides)
        .map( \ elt -> elt.StatusMismatchMessage)
    if (!reqMessages.Empty) {
      return reqMessages
    }

    return Augmentable.collectWithNode(rules, node, \x -> x.Rules)
        .flatMap( \ f -> f.Second.getValidity(validationArgs))
        .map( \ elt -> elt.Message)
  }
}
