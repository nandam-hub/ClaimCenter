package gw.web.multicluster

uses gw.api.json.JsonObject
uses gw.servlet.Servlet

uses jakarta.servlet.http.HttpServlet
uses jakarta.servlet.http.HttpServletRequest
uses jakarta.servlet.http.HttpServletResponse
uses java.net.URLDecoder
uses java.util.concurrent.ConcurrentHashMap
uses java.util.concurrent.LinkedBlockingQueue
uses java.util.regex.Pattern

/**
 * This servlet is included for testing the {@link gw.plugin.web.multicluster.IMultiClusterSessionPlugin} and is not
 * suitable for production use. It relies on {@link SampleMultiClusterSessionPlugin} which is a test implementation
 * of the work plugin, also not suitable for production use.
 */
@Export
@Servlet(\ path -> path.matches("/samplemulticluster.*"))
class SampleMultiClusterSessionServlet extends HttpServlet {

  private static class SessionState {
    var _unsavedWork: Collection<Location> as UnsavedWork = new LinkedBlockingQueue<Location>()
    var _keepAliveUrl: String as KeepAliveUrl
  }

  private var _locationsByShardByUser = new ConcurrentHashMap<ShardByUser, SessionState>()

  private function handleRequest(req : HttpServletRequest, resp: HttpServletResponse,
                                 cons: block(shardId:String, userId:String, rest:String)) : void {
    var pat = Pattern.compile("/samplemulticluster/users/([^/]+)/shards/([^/]+)(.*)")
    var matcher = pat.matcher(req.PathInfo)
    if (matcher.matches()) {
      var userId = URLDecoder.decode(matcher.group(1), "UTF-8")
      var shardId = URLDecoder.decode(matcher.group(2), "UTF-8")
      cons(shardId, userId, matcher.group(3))
      return
    }

    resp.setStatus(400) // no shard id provided
  }

  protected override function doPost(req : HttpServletRequest, resp : HttpServletResponse) {
    handleRequest(req, resp, \shardId, userId, rest -> {
      var sessionState = _locationsByShardByUser
          .computeIfAbsent(new ShardByUser(shardId, userId), \shardByUser -> new SessionState())
      if (req.PathInfo.contains("/locations")) {
        var key = req.getParameter("key")
        var title = req.getParameter("title")
        var timeStamp = req.getParameter("timeStamp")
        var groupKey = req.getParameter("groupKey")
        var groupTitle = req.getParameter("groupTitle")
        sessionState.UnsavedWork.removeIf(\ loc -> loc.Key == key)
        sessionState.UnsavedWork.add(new Location(key, title, shardId, timeStamp, groupKey, groupTitle))
      } else {
        sessionState.KeepAliveUrl = req.getParameter("url")
      }
      resp.setStatus(201)
    })
  }

  protected override function doDelete(req : HttpServletRequest, resp : HttpServletResponse) {
    handleRequest(req, resp, \shardId, userId, rest -> {
      var pat = Pattern.compile("/locations/([^/]+).*")
      var matcher = pat.matcher(rest)
      if (matcher.matches()) {
        var key = URLDecoder.decode(matcher.group(1), "UTF-8")
        var queue = _locationsByShardByUser.get(new ShardByUser(shardId, userId)).UnsavedWork
        if (queue != null) {
          for (loc in queue iterator it) {
            if (loc.Key == key) {
              it.remove()
              resp.setStatus(200)
              return
            }
          }
        }
        resp.setStatus(404)
      } else {
        // Session closed, remove everything
        _locationsByShardByUser.remove(new ShardByUser(shardId, userId))
        resp.setStatus(200)
      }
    })
  }

  protected override function doGet(req : HttpServletRequest, resp : HttpServletResponse){
      handleRequest(req, resp, \curShardId, userId, rest -> {
        var locations = req.PathInfo.contains("/locations")
        var results: List<Object> = {}
        for (entry in _locationsByShardByUser.entrySet()) {
          var shardByUser = entry.Key
          if (userId == shardByUser.UserId && curShardId != shardByUser.ShardId) {
            if (locations) {
              entry.Value.UnsavedWork.map(\u -> u.toJson()).each(\j -> results.add(j))
            } else {
              results.add(entry.Value.KeepAliveUrl)
            }
          }
        }
        var resultWrapper = new JsonObject()
        resultWrapper.put("results", results)
        resp.Writer.write(resultWrapper.toJsonString())
      resp.setStatus(200)
    })
  }

  private static class ShardByUser {
    private final var _shardId : String as readonly ShardId
    private final var _userId : String as readonly UserId

    construct(shardId : String, userId : String) {
      this._shardId = shardId
      this._userId = userId
    }

    public override function equals(o : Object) : boolean {
      if (o typeis ShardByUser) {
        var that = o as ShardByUser
        return Objects.equals(_shardId, that._shardId) && Objects.equals(_userId, that._userId)
      }
      return false
    }

    public override function hashCode() : int {
      return Objects.hash({_shardId, _userId})
    }
  }

  private static class Location {

    static var SHARD_ID_PATTERN = Pattern.compile("Shard_([^_]+)_(\\w+)_(\\d+)")

    private final var _key: String as readonly Key
    private final var _title: String as readonly Title
    private final var _shardId: String as readonly ShardId
    private final var _timeStamp: String as readonly TimeStamp
    private final var _groupKey: String as readonly GroupKey
    private final var _groupTitle: String as readonly GroupTitle


    construct(key: String, title: String, shardId: String, timeStamp: String, groupKey: String, groupTitle: String) {
      _key = key
      _title = title
      _shardId = shardId
      _timeStamp = timeStamp
      _groupKey = groupKey
      _groupTitle = groupTitle
    }

    public function toJson():JsonObject {
      var jsonObj = new JsonObject()
      jsonObj.put("key", Key)
      jsonObj.put("title", Title)
      jsonObj.put("shardUrl", shardIdToUrl(ShardId))
      jsonObj.put("timeStamp", TimeStamp)
      jsonObj.put("groupKey", GroupKey)
      jsonObj.put("groupTitle", GroupTitle)
      return jsonObj
    }

    private function shardIdToUrl(shardId: String): String {
      var matcher = SHARD_ID_PATTERN.matcher(shardId)
      if (!matcher.matches()) {
        throw new IllegalArgumentException("Badly formatted shard id: " + shardId)
      }
      return "http://" + matcher.group(1) + ":" + matcher.group(3) + "/" + matcher.group(2)
    }
  }

}