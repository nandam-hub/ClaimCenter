import { GwPartialReloadDetails, GwTypedMap } from "../../types/gwTypes";
import { GwRegisteredSystem } from "./GwRegisteredSystem";

/**
 * Guidewire's TypeScript APIs are an early-stage feature and are subject to change in a future release.
 */
export abstract class GwInitializableSystem extends GwRegisteredSystem {
  private static readonly _initializableSystems: GwTypedMap<{
    getSystemName(): string;
    init(isFullPageReload: boolean, partialReloadDetails?: GwPartialReloadDetails): void;
  }> = {};

  constructor() {
    super();
    if (this.availableToInitialize()) {
      GwInitializableSystem.register(this);
    }
  }

  protected availableToInitialize(): boolean {
    return true;
  }

  abstract init(isFullPageReload: boolean, partialReloadDetails?: GwPartialReloadDetails): void;

  /**
   * This method registers an object to be notified on every page reload, partial or full; on each reload the "init"
   * method will be called on the given object.
   *
   * Subclasses of GwInitializableSystem are automatically registered: register is called by the GwInitializableSystem
   * constructor.
   *
   * This method should NOT be used for the global systems that are ORDER DEPENDENT. These systems should extend
   * GwOrderDependentInitializableSystem, and be manually placed in order in gwApp.getInitializationOrderSpecificSystems
   * @param {GwInitializableSystem} system
   */
  static register(system: {
    getSystemName(): string;
    init(isFullPageReload: boolean, partialReloadDetails?: GwPartialReloadDetails): void;
  }): void {
    if (Object.prototype.hasOwnProperty.call(GwInitializableSystem._initializableSystems, system.getSystemName())) {
      throw new Error(
        "Attempting to register an initialization system object with a system name that's already been registered: " +
          system.getSystemName()
      );
    }

    GwInitializableSystem._initializableSystems[system.getSystemName()] = system;
  }

  static initializeSystems(isFullPageReload: boolean, partialReloadDetails?: GwPartialReloadDetails): void {
    for (const key in GwInitializableSystem._initializableSystems) {
      if (Object.prototype.hasOwnProperty.call(GwInitializableSystem._initializableSystems, key)) {
        const systemObj = GwInitializableSystem._initializableSystems[key];
        if (systemObj) {
          systemObj.init(isFullPageReload, partialReloadDetails);
        } else {
          console.error(
            "Found initializable system key with an invalid system object. This is likely an error in JavaScript. System name: " + key
          );
        }
      }
    }
  }
}
