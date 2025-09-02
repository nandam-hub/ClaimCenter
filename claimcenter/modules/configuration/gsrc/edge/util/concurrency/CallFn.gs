package edge.util.concurrency

uses java.lang.IllegalArgumentException

class CallFn<T1, T2, T3> {

  var _fn1(arg1 : T1) : Object
  var _fn2(arg1 : T1, arg2 : T2) : Object
  var _fn3(arg1 : T1, arg2 : T2, arg3 : T3) : Object
  var _arg1 : T1
  var _arg2 : T2
  var _arg3 : T3

  construct(runFn1(arg1 : T1) : Object, runFn2(arg1 : T1, arg2 : T2) : Object, runFn3(arg1 : T1, arg2 : T2, arg3 : T3) : Object, arg1 : T1, arg2 : T2, arg3 : T3){
    _fn1 = runFn1
    _fn2 = runFn2
    _fn3 = runFn3
    _arg1 = arg1
    _arg2 = arg2
    _arg3 = arg3
  }

  public function call() : Object{
    if(_fn1 != null) {
      return _fn1(_arg1)
    } else if(_fn2 != null) {
      return _fn2(_arg1, _arg2)
    } else if(_fn3 != null) {
      return _fn3(_arg1, _arg2, _arg3)
    } else {
      throw new IllegalArgumentException("No function provided")
    }
  }

}
