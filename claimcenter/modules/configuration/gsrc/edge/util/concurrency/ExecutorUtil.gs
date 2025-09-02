package edge.util.concurrency

uses gw.pl.persistence.core.Bundle
uses gw.transaction.ResourceAutoCloseable
uses gw.transaction.Transaction

uses java.util.concurrent.Callable
uses java.util.concurrent.ExecutorService
uses java.util.concurrent.Executors
uses java.lang.Integer
uses java.util.concurrent.FutureTask

class ExecutorUtil {

  public static function newFixedThreadPool(numOfThreads : int, limit : Integer) : ExecutorService {
    var maxThreads = numOfThreads
    if (limit != null && limit > 0) {
      maxThreads = numOfThreads >= limit ? limit : numOfThreads
    }

    return Executors.newFixedThreadPool(maxThreads)
  }

  /**
   * Executes a list of callables with at most the given degree of parallelism
   */
  @Param("maxParallelism", "maximum number of threads to be used for the parallel execution")
  @Param("callables", "a list of callables")
  @Returns("a list of results obtained by invoking the callables")
  @Throws(Exception, "any exception that is not explicitly handled in the callable")
  public static reified function parallelExecution<S>(maxParallelism : int, callables : List<Callable<S>>): List<S> {

    var numWorkerThreads = Math.min(maxParallelism, callables.Count)
    var activityExecutor : ExecutorService = null
    var toFutureTask = \ c : Callable<S> -> new FutureTask<S>(c)


    try {
      activityExecutor = Executors.newFixedThreadPool(numWorkerThreads)

      var toSubmittedTask = \ ft : FutureTask<S> -> {activityExecutor.submit(ft); return ft}
      var toFutureResult = \ ft : FutureTask<S> -> ft.get()

      return callables
            // wrap into future task
          .map(toFutureTask)
            // submit
          .map(toSubmittedTask)
            // wait for the results
          .map(toFutureResult)
          .toList()

    } finally {
      activityExecutor?.shutdown()
    }



  }

  /**
   * Runs an operation with a thread specific bundle and with the given execution user
   */
  @Param("threadUser", "the user used for running the operations")
  @Param("runInBundle", "the operation to be performed with a thread bundle")
  @Param("onException", "an optional operation to bail in case of exeption while running in the operation 'runInBundle'")
  public static reified function withThreadBundle<R>(threadUser : User, runInBundle : block(Bundle) : R, onException : block(Exception) : R) : Callable<R> {
    // return the callable
    return \ -> {
      var newToken  = Transaction.createAuthenticatedToken(threadUser.ID)
      var closeable1 : ResourceAutoCloseable
      try {
        closeable1 = Transaction.setServiceToken(newToken)
        var bundle = Transaction.newBundle()

        var closeable2 : ResourceAutoCloseable
        try {
          closeable2 = Transaction.setThreadsBundle(bundle)
          try {
            return runInBundle(bundle)
          } catch (e : Exception) {
            if (null == onException) {
              throw e;
            }
            return onException(e);
          }
        } finally {
          closeable2?.close()
        }
      } finally {
        closeable1?.close()
      }
    }
  }

}
