package edge.util.concurrency

uses java.lang.Void
uses java.util.concurrent.Callable

class CallableUtil {

  public static reified function newCallable<T1>(callFn(arg1 : T1) : Object, arg1 : T1) : Callable {
    var newCallFn = new CallFn <T1, Void, Void>(callFn, null, null, arg1, null, null)
    return new EdgeCallable(newCallFn)
  }

  public static reified function newCallable<T1, T2>(callFn(arg1 : T1, arg2 : T2) : Object, arg1 : T1, arg2 : T2) : Callable {
    var newCallFn = new CallFn <T1, T2, Void>(null, callFn, null, arg1, arg2, null)
    return new EdgeCallable(newCallFn)
  }

  public static reified function newCallable<T1, T2, T3>(callFn(arg1 : T1, arg2 : T2, arg3 : T3) : Object, arg1 : T1, arg2 : T2, arg3 : T3) : Callable {
    var newCallFn = new CallFn <T1, T2, T3>(null, null, callFn, arg1, arg2, arg3)
    return new EdgeCallable(newCallFn)
  }

}
