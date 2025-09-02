import { GwAjaxResponseStatus, GwDomNode, GwMap } from "../../types/gwTypes";
import { gwInputs } from "../inputs/gwInputs";
import { gwInputSystems } from "../inputs/gwInputSystems";
import { gwAjax } from "../util/gwAjax";
import { GwRegisteredSystem } from "../util/GwRegisteredSystem";

/**
 * Guidewire's TypeScript APIs are an early-stage feature and are subject to change in a future release.
 */
export class GwSumReflection extends GwRegisteredSystem {
  private updatedValues: GwMap = {};

  getSystemName(): string {
    return "gwSumReflection";
  }

  clearValues(): void {
    this.updatedValues = {};
  }

  updateValue(node: GwDomNode, args: GwMap): void {
    const sumValueWidgetId = args.sumValueWidgetId;
    if (!Object.prototype.hasOwnProperty.call(this.updatedValues, sumValueWidgetId)) {
      this.updatedValues[sumValueWidgetId] = {};
    }
    this.updatedValues[sumValueWidgetId][node.id] = gwInputs.getValueById(node.id);
    this.recalculateSum(sumValueWidgetId, node);
  }

  recalculateSum(sumValueWidgetId: string, inputNode: GwDomNode): void {
    const requestObject = {
      sumValueWidgetId: sumValueWidgetId,
      updatedValues: this.updatedValues[sumValueWidgetId],
    };
    const requestParams: GwMap = {};
    requestParams["__calcSum"] = JSON.stringify(requestObject);
    gwAjax.ajaxRequest(requestParams, this.handleResponse.bind(this, sumValueWidgetId, inputNode), this.handleError.bind(this, inputNode));
  }

  /**
   * Handles a response from the server with the reflected value.
   */
  private handleResponse(sumValueWidgetId: string, inputNode: GwDomNode, response: GwMap): void {
    if (response["ready"] === true) {
      gwInputSystems.clearInvalidValueStatus(inputNode);
      const sum = response["sum"];
      const altSum = response["altSum"];
      if (altSum === undefined) {
        this.updateSumValue(sumValueWidgetId, sum);
      } else {
        this.updateSumAndAltSumValue(sumValueWidgetId, sum, altSum);
      }
    }
    return;
  }

  private updateSumValue(sumValueWidgetId: string, sumValue: string): void {
    const node: any = document.querySelector("#" + sumValueWidgetId + " .gw-vw--value");
    node.innerText = sumValue === undefined || sumValue === null ? "" : sumValue;
  }

  private updateSumAndAltSumValue(sumValueWidgetId: string, sumValue: string, altSumValue: string): void {
    const node: any = document.querySelector("#" + sumValueWidgetId + " .gw-SumValue--modelValue");
    node.innerText = sumValue === undefined || sumValue === null ? "" : sumValue;
    const altSumNode: any = document.querySelector("#" + sumValueWidgetId + " .gw-SumValue--altValue");
    altSumNode.innerText = altSumValue === undefined || altSumValue === null ? "" : altSumValue;
  }

  private handleError(inputNode: GwDomNode): boolean {
    gwInputSystems.addInvalidValueStatus(inputNode);
    return false;
  }
}

export const gwSumReflection = new GwSumReflection();
