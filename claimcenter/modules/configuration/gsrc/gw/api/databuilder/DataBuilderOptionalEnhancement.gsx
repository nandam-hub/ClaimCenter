package gw.api.databuilder

uses gw.pl.persistence.core.Bean

@Export
enhancement DataBuilderOptionalEnhancement<T extends Bean, B extends DataBuilder<T, B>> : DataBuilder<T, B> {
  /**
   * Perform the action if value is nonempty, then return the receiver. This provides fluency around
   * populating fields that should only be set to non-null values. For instance
   * <pre>
   *   // --- instead of interrupting the flow
   *   var groupBuilder = new GroupBuilder
   *     .withUser(andy)
   *     .withUser(betty)
   *
   *   getChris().ifPresent(\user -> groupBuilder.withUser(user))
   *
   *   groupBuilder
   *     .withUser(dave)
   *
   *   getEmily().ifPresent(\user -> groupBuilder.withUser(user))
   *
   *   return
   *     .withUser(fred)
   *     .create()
   *
   *   // --- or rearranging the call order
   *   var groupBuilder = new GroupBuilder
   *     .withUser(andy)
   *     .withUser(betty)
   *     .withUser(dave)
   *     .withUser(fred)
   *
   *   getChris().ifPresent(\user -> groupBuilder.withUser(user))
   *   getEmily().ifPresent(\user -> groupBuilder.withUser(user))
   *
   *   return groupBuilder.create()
   *
   *   // --- you can preserve the order and keep it fluent
   *   return new GroupBuilder
   *     .withUser(andy)
   *     .withUser(betty)
   *     .whenPresent(getChris(), GroupBuilder#withUser(User))
   *     .withUser(dave)
   *     .whenPresent(getEmily(), GroupBuilder#withUser(User))
   *     .withUser(fred)
   *     .create()
   * </code>
   *
   * @param value An Optional that may contain null
   * @param action The work to perform using the value of the Optional when it is not null
   * @param <A>
   * @return this builder
   */
  reified function whenPresent<A>(value : Optional<A>, action : block(builder : B, value : A) : B) : B {
    value.ifPresent(\nonNullValue -> action(this.self(), nonNullValue))
    return this.self()
  }

  /**
   * Perform the action if value is non-null, then return the receiver. This provides fluency around
   * populating fields that should only be set to non-null values. For instance
   * <pre>
   *   // --- instead of interrupting the flow
   *   var groupBuilder = new GroupBuilder
   *     .withUser(andy)
   *     .withUser(betty)
   *
   *   var chris = getChris()
   *   if (chris != null) { groupBuilder.withUser(chris) }
   *
   *   groupBuilder
   *     .withUser(dave)
   *
   *   var emily = getEmily()
   *   if (getEmily != null) { groupBuilder.withUser(emily) }
   *
   *   return
   *     .withUser(fred)
   *     .create()
   *
   *   // --- or rearranging the call order
   *   var groupBuilder = new GroupBuilder
   *     .withUser(andy)
   *     .withUser(betty)
   *     .withUser(dave)
   *     .withUser(fred)
   *
   *   if (chris != null) { groupBuilder.withUser(chris) }
   *   if (getEmily != null) { groupBuilder.withUser(emily) }
   *
   *   return groupBuilder.create()
   *
   *   // --- you can preserve the order and keep it fluent
   *   return new GroupBuilder
   *     .withUser(andy)
   *     .withUser(betty)
   *     .whenNonNull(getChris(), GroupBuilder#withUser(User))
   *     .withUser(dave)
   *     .whenNonNull(getEmily(), GroupBuilder#withUser(User))
   *     .withUser(fred)
   *     .create()
   * </code>
   *
   * @param value An value that may be null
   * @param action The work to perform using the value when it is not null
   * @param <A>
   * @return this builder
   */
  reified function whenNonNull<A>(value : A, action : block(builder : B, value : A) : B) : B {
    return whenPresent(Optional.ofNullable(value), action)
  }
}
