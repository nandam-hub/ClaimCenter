package gw.web.multicluster

uses gw.api.json.JsonObject
uses gw.api.system.PLLoggerCategory
uses gw.api.system.server.ServerUtil
uses gw.api.web.WebUtil
uses gw.plugin.InitializablePlugin
uses gw.plugin.PluginParameter
uses gw.plugin.web.multicluster.IMultiClusterSessionPlugin
uses gw.plugin.web.multicluster.IRemoteUnsavedWork
uses gw.plugin.web.multicluster.IMultiClusterSession
uses gw.util.StreamUtil
uses org.apache.http.Consts
uses org.apache.http.NameValuePair
uses org.apache.http.client.entity.UrlEncodedFormEntity
uses org.apache.http.client.methods.HttpDelete
uses org.apache.http.client.methods.HttpGet
uses org.apache.http.client.methods.HttpPost
uses org.apache.http.impl.client.HttpClients
uses org.apache.http.message.BasicNameValuePair
uses org.apache.http.util.EntityUtils
uses pcf.MultiClusterNavigation

uses jakarta.servlet.http.HttpServletRequest
uses java.net.InetAddress
uses java.net.URLEncoder

/**
 * This sample plugin implementation is included purely for instructional and testing purposes; it is totally
 * unsuitable for production use. It relies on a test version of an unsaved work service provided by
 * {@link SampleMultiClusterSessionServlet}.
 *
 * One big limitation of this implementation is that it maintains unsaved work per user instead of per user session.
 * This makes it useful for rudimentary testing of the unsaved work feature, without having to implement single
 * sign on - any sessions for a given user id are treated as a single unsaved work session. But it also introduces
 * incorrect behavior - if a user is logged in twice to the same server unsaved work from both their sessions will
 * be combined, even though one session cannot be used to jump to unsaved work in the other session.
 */
@Export
@PluginParameter(:name="WIPServiceUrl", :type=URL)
class SampleMultiClusterSessionPlugin implements IMultiClusterSessionPlugin, InitializablePlugin {

  private static class Session implements IMultiClusterSession {

    var _userId: String as readonly UserId

    construct(user: User) {
      _userId = String.valueOf(user.ID)
    }

    function toUrlParameter(): String {
      return URLEncoder.encode(_userId, "UTF-8")
    }
  }

  private static class SampleRemoteWork implements IRemoteUnsavedWork {

    var _url: String as readonly Url
    var _title: String as readonly Title
    var _timeStamp: long as readonly TimeStamp
    var _groupKey: String as readonly GlobalGroupKey
    var _groupTitle: String as readonly GroupTitle

    construct(url: String, title: String, timeStamp: long, groupKey: String, groupTitle: String) {
      _url = url
      _title = title
      _timeStamp = timeStamp
      // Prepend group key with url to make it globally unique
      _groupKey = (groupKey != null) ? _url + "\n" + groupKey : null;
      _groupTitle = groupTitle;
    }

    property get GlobalKey(): String {
      // URL makes a good globally unique string
      return _url
    }
  }

  private var _httpClient = HttpClients.createDefault()
  private var _serviceUrl: String

  private function sessionUrl(session: IMultiClusterSession): String {
    return _serviceUrl + "users/" + (session as Session).toUrlParameter()
  }

  private function shardUrl(session: IMultiClusterSession): String {
    return sessionUrl(session) + "/shards/" + URLEncoder.encode(ShardId, "UTF-8")
  }

  private function locationUrl(session: IMultiClusterSession, locationKey: String): String {
    return shardUrl(session) + "/locations/" + URLEncoder.encode(locationKey, "UTF-8")
  }

  private function locationsUrl(session: IMultiClusterSession): String {
    return shardUrl(session) + "/locations"
  }

  private function keepAliveUrl(session: IMultiClusterSession): String {
    return shardUrl(session) + "/keepalive"
  }

  override property set Parameters(params: Map<Object, Object>) {
    if (params.containsKey("WIPServiceUrl")) {
      _serviceUrl = params.get("WIPServiceUrl") as String
      _serviceUrl += _serviceUrl.endsWith("/") ? "" : "/"
    } else {
      throw new IllegalStateException("SampleMultiClusterSessionPlugin cannot work w/o WIP Service Url set")
    }
  }

  override function getOrCreateSession(user: User, request: HttpServletRequest): IMultiClusterSession {
    var session = new Session(user)
    var params: List<NameValuePair> = {}
    params.add(new BasicNameValuePair("url", WebUtil.getBasePath() + "/KeepAlive.do"))
    var entity = new UrlEncodedFormEntity(params, Consts.UTF_8)
    var method = new HttpPost(keepAliveUrl(session))
    method.Entity = entity
    using (var response = _httpClient.execute(method)) {
      if (response.StatusLine.StatusCode != 201) {
        throw new IllegalStateException("Unable to add keep alive URL to the remote WIP service")
      }
    }
    return session
  }

  override function closeLocalSession(session : IMultiClusterSession) {
    var method = new HttpDelete(shardUrl(session))
    using (var response = _httpClient.execute(method)) {
      if (response.StatusLine.StatusCode != 200) {
        throw new IllegalStateException("Unable to close local session: " + session)
      }
    }
  }

  override function addLocalUnsavedWork(
      session: IMultiClusterSession,
      key: String,
      title: String,
      timeStamp: long,
      groupKey: String,
      groupTitle: String) {
    var params: List<NameValuePair> = {}
    params.add(new BasicNameValuePair("key", key))
    params.add(new BasicNameValuePair("title", title))
    params.add(new BasicNameValuePair("timeStamp", Long.toString(timeStamp)))
    params.add(new BasicNameValuePair("groupKey", groupKey))
    params.add(new BasicNameValuePair("groupTitle", groupTitle))
    var entity = new UrlEncodedFormEntity(params, Consts.UTF_8)
    var method = new HttpPost(locationsUrl(session))
    method.Entity = entity
    using (var response = _httpClient.execute(method)) {
      if (response.StatusLine.StatusCode != 201) {
        throw new IllegalStateException("Unable to add a unsaved work item to the remote WIP service")
      }
    }
  }

  override function removeLocalUnsavedWork(session: IMultiClusterSession, key: String) {
    var method = new HttpDelete(locationUrl(session, key))
    using (var response = _httpClient.execute(method)) {
      if (response.StatusLine.StatusCode != 200) {
        throw new IllegalStateException("Unable to delete the unsaved work item with a key: " + key)
      }
    }
  }

  override function getRemoteUnsavedWork(session: IMultiClusterSession): Set<IRemoteUnsavedWork> {
    var method = new HttpGet(locationsUrl(session))
    var remoteWork: Set<IRemoteUnsavedWork> = {}
    using (var response = _httpClient.execute(method)) {
      if (response.StatusLine.StatusCode != 200) {
        throw new IllegalStateException("Unable to get the unsaved work items")
      }

      var jsonResponse = JsonObject.parse(StreamUtil.toString(EntityUtils.toByteArray(response.Entity)))
      var results = jsonResponse.getArray("results")
      results.each(\el -> {
        var json = el as JsonObject
        var key = json.get("key") as String
        var title = json.get("title") as String
        var timeStamp = Long.parseLong(json.get("timeStamp") as String)
        var groupKey = json.get("groupKey") as String
        var groupTitle = json.get("groupTitle") as String
        var shardUrl = json.get("shardUrl") as String
        var fullUrl = (shardUrl.endsWith("/") ? shardUrl : shardUrl + "/")
            + "MultiClusterEntry.do?locationKey=" + URLEncoder.encode(key, "UTF-8")
        remoteWork.add(new SampleRemoteWork(fullUrl, title, timeStamp, groupKey, groupTitle))
      })
    }
    return remoteWork
  }

  override function getRemoteKeepAliveUrls(session : IMultiClusterSession) : Set<String> {
    var method = new HttpGet(keepAliveUrl(session))
    using (var response = _httpClient.execute(method)) {
      if (response.StatusLine.StatusCode != 200) {
        throw new IllegalStateException("Unable to get keep alive Urls")
      }

      var jsonResponse = JsonObject.parse(StreamUtil.toString(EntityUtils.toByteArray(response.Entity)))
      return (jsonResponse.getArray("results") as List<String>).toSet()
    }
  }

  override function goToRemoteWork(session : IMultiClusterSession, remoteWork : IRemoteUnsavedWork, goToGroup : boolean) {
    if (remoteWork typeis SampleRemoteWork) {
      MultiClusterNavigation.push(remoteWork.Url + "&goToGroup=" + goToGroup)
    } else {
      throw new IllegalArgumentException("Remote work must have been created by unsaved work plugin")
    }
  }

  override function leaveCluster(session : IMultiClusterSession, url : String) {
    // This simple implementation doesn't do any caching, so there's nothing to do
    PLLoggerCategory.PLUGIN.info("Leaving session using URL: " + url)
  }

  property get ShardId(): String {
    // This implementation is only useful for simple local testing, so you can start two servers with the same
    // configuration and have them talk to each other. But it is totaly unsuitable for production use. A realistic
    // implementation would use PLConfigParameters.ShardId
    return "Shard_" + InetAddress.getLocalHost().getHostName() + "_"
        + ServerUtil.Product.ProductCode.toLowerCase() + "_" + System.getProperty("gw.port")
  }

}