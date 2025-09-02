package edge.el.compilation

/** Plugging point used to implement operation compilation. */
interface OperatorCompiler {
  /** Compiles operator (or function) invocation using array of input parameters to the operator. */
  public function compileOperator(args: CompilationResult[]) : CompilationResult
}
