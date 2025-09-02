package edge.util.platformenhancement
uses java.util.ArrayList

enhancement ListEnhancement<T> : java.util.List<T> {
  function mapWithIndex<R>(cb(item:T, idx : int) : R): List<R> {
    final var res = new ArrayList<R>(this.size())
    var idx = 0
    final var itr = this.iterator()
    while(itr.hasNext()) {
      res.add(cb(itr.next(), idx))
      idx++
    }
    return res
  }
  
}
