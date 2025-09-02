package gw.plugin.management

uses gw.api.system.server.Runlevel

uses java.util.concurrent.atomic.AtomicBoolean

@Export
@SuppressWarnings({"unused", "HiddenPackageReference"})
class HealthProbePluginImpl implements HealthProbePlugin {
  private var _started = new AtomicBoolean(false)

  /**
   * Add additional conditions for whether application can be considered started here.</br>
   * If your application needs to complete other initialization(s), for example pre-loading objects, <b>after</b>
   * reaching multi-user, then you should set the <code>started</code> field of the response to <code>true</code> only
   * if such initialization(s) are complete.
   *
   * @return a {@link HealthProbeStartupStatus} object.
   *         @see gw.plugin.management.HealthProbePlugin#getStarted
   */
  override property get Started() : HealthProbeStartupStatus {
    _started.compareAndExchange(false, MultiUser)  // If currently false, sets it to value of MultiUser

    var started = _started.get()
    var code: HealthProbeStatusCode
    var msg: String = null
    var startupException = Runlevel.StartupException
    if (startupException == null) {
      code = started ? HealthProbeStatusCode.Success : HealthProbeStatusCode.InProgress
    } else {
      code = HealthProbeStatusCode.Error
      msg = startupException.LocalizedMessage
    }

    return new HealthProbeStartupStatus(code, msg)
  }

  /**
   * Add additional conditions for readiness, if any, here.
   *
   * @return a {@link HealthProbeReadinessStatus} object.
   *         @see gw.plugin.management.HealthProbePlugin#getReady
   */
  override property get Ready() : HealthProbeReadinessStatus {
    var ready = Started.code == HealthProbeStatusCode.Success && MultiUser

    var code: HealthProbeStatusCode
    var msg: String = null
    var startupException = Runlevel.StartupException
    if (startupException == null) {
      code = ready ? HealthProbeStatusCode.Success : HealthProbeStatusCode.InProgress
    } else {
      code = HealthProbeStatusCode.Error
      msg = startupException.LocalizedMessage
    }

    return new HealthProbeReadinessStatus(code, msg)
  }

  /**
   * Add additional conditions for liveness, if any, here.
   *
   * @return a {@link HealthProbeLivenessStatus} object.
   *         @see gw.plugin.management.HealthProbePlugin#getLive
   */
  override property get Live() : HealthProbeLivenessStatus {
    // If we can get here, then application must be live.
    return new HealthProbeLivenessStatus(HealthProbeStatusCode.Success, null)
  }

  /**
   * Whether the current runlevel is multi-user or not.
   *
   * @return <code>true</code> if the current runlevel is multi-user, <code>false</code> else
   */
  private property get MultiUser() : boolean {
    return Runlevel.getCurrentNoLock() == Runlevel.MULTIUSER
  }
}