import {GwPartialReloadDetails} from "../../types/gwTypes";
import {GwRegisteredSystem} from "./GwRegisteredSystem";

/**
 * Guidewire's TypeScript APIs are an early-stage feature and are subject to change in a future release.
 */
export abstract class GwOrderDependentInitializableSystem extends GwRegisteredSystem {
  abstract orderSpecificInit (isFullPageReload: boolean, partialReloadDetails?: GwPartialReloadDetails): void;
}