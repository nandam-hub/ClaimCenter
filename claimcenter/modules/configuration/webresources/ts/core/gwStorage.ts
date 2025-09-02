/**
 * Handles the getting and setting of local storage. All local storage should be accessed via
 * get and set here, as this system partitions local storage by session so that information
 * belonging to different user sessions will never be mixed.
 */
import { GwMap } from "../types/gwTypes";
import { gwForm } from "./gwForm";
import { gwScroll } from "./gwScroll";
import { GwOrderDependentInitializableSystem } from "./util/GwOrderDependentInitializableSystem";
import { gwUtil } from "./util/gwUtil";

/**
 * Guidewire's TypeScript APIs are an early-stage feature and are subject to change in a future release.
 */
export class GwStorage extends GwOrderDependentInitializableSystem {
  getSystemName(): string {
    return "gwStorage";
  }

  private _sessionId: string = "";
  private _retryCount: number = 0;

  /**
   * Holds a parsed cache object of the entire session storage, to prevent multiple gets from having to JSON.parse each time.
   * Is invalidated on full page reload and localstorage clear.
   */
  private _sessionStorageCache: GwMap | null = null;

  /**
   * Called after every full and partial page reload
   */
  orderSpecificInit(fullPageReload: boolean): void {
    this.updateSessionId();
  }

  /**
   * @public
   * Sets a key value pair in local storage at a dotDelimted path. k<String>, v<*>
   *     Calls setStorageForSession
   * @param dotPath: dot delimted path.
   * @param value: any valid JSON stringify-able value
   */
  set(dotPath: string, value: any): void {
    if (!window.localStorage) {
      return;
    }

    this._retryCount = this._retryCount || 0;
    const keyAndPathArr = this.getKeyAndPathArray(dotPath);
    const pathArray = keyAndPathArr.pathArray;
    const finalKey = keyAndPathArr.key;

    const sessionStorageObject = this.getStorageForSession();
    const obj = this.getValueAtDotPath(pathArray, sessionStorageObject);

    if (value === null || value === "null" || value === undefined || value === "undefined") {
      delete obj[finalKey];
    } else {
      obj[finalKey] = value;
    }

    this.setStorageForSession(sessionStorageObject, dotPath, value);
  }

  /**
   * @public
   * get a value at key in local storage. k<String>, v<String> but the set and get are modified to allow
   * booleans to be set and get as actual booleans, for ease of use.
   * @param dotPath: String, unique
   * @return {*}: if value is "true" or "false" will convert to boolean. if "null" will convert to null;
   */
  get(dotPath: string): any {
    if (!window.localStorage) {
      return;
    }

    const value = this.getValueAtDotPath(dotPath, this.getStorageForSession(), true);
    return gwUtil.convertIfString(value);
  }

  toggleFlag(dotPath: string, optDefault?: boolean): boolean {
    //TODO, @optimize. This could pull and set on the same object to be faster.
    let currVal = this.get(dotPath);
    if (!gwUtil.hasValue(currVal)) {
      currVal = optDefault;
    }

    this.set(dotPath, !currVal);
    return !currVal;
  }

  /**
   * Helper method to remove a value. Just calls .set with null
   * @param dotPath
   */
  remove(dotPath: string): void {
    this.set(dotPath, null);
  }

  /**
   * @public
   * Deletes local storage for the current session.
   */
  clearStorage(): void {
    this._sessionStorageCache = null;
    if (window.localStorage) {
      window.localStorage.removeItem(this.getStoragePathForSession());
    }
  }

  private updateSessionId(): void {
    const sessionInfo = gwUtil.getSessionInfo();
    const newSessionId = sessionInfo.appId + ":" + sessionInfo.userId;
    const isNewAuthenticatedSession = sessionInfo.isNew && sessionInfo.userId;
    if (isNewAuthenticatedSession && this._sessionId) {
      // Clear previous session, if any
      this.clearStorage();
    }
    this._sessionId = newSessionId;
    if (isNewAuthenticatedSession) {
      // Clear brand new session, just in case old session timed out and wasn't cleared up
      this.clearStorage();
    }
  }

  /**
   * @private
   * Takes a dot delimited path or pathArray and returns the value at the path on the given object.
   * If any path chunks are undefined, then it creates the object and adds it to the provided storage object
   * @param path
   * @param sessionStorageObject
   * @returns {*}
   */
  private getValueAtDotPath(path: string | string[], sessionStorageObject: GwMap, returnFirstUndefined: boolean = false): any {
    const arr = Array.isArray(path) ? path : path.split(".");
    let obj = sessionStorageObject;

    for (let i = 0; i < arr.length; i++) {
      const pathPart = arr[i];
      let objectAtPathPart = obj[pathPart];

      if (objectAtPathPart === undefined || objectAtPathPart === null) {
        //Instead of replacing it with an empty object we'll just return undefined.
        //This allows different methods to use getValueAtDotPath for different needs.
        if (returnFirstUndefined) {
          return undefined;
        }
        objectAtPathPart = {};
        obj[pathPart] = objectAtPathPart;
      }

      obj = objectAtPathPart;
    }

    return obj;
  }

  /**
   * @private
   * @param path
   * @returns {{key: String, pathArray: String[]}}
   */
  private getKeyAndPathArray(path: string | string[]): GwMap {
    const arr = Array.isArray(path) ? path : path.split(".");
    const key = arr.pop();
    return { key: key, pathArray: arr };
  }

  /**
   * @private
   * Returns the session storage cache if it exists, or if not, goes and gets it. If still
   * undefined, then creates a new object and returns it.
   * @returns {*}
   */
  private getStorageForSession(): GwMap {
    if (!this._sessionStorageCache) {
      let storage: string | null = null;
      if (window.localStorage) {
        storage = window.localStorage.getItem(this.getStoragePathForSession());
      }

      if (storage) {
        this._sessionStorageCache = JSON.parse(storage) || {};
      } else {
        this._sessionStorageCache = {};
      }
    }

    return this._sessionStorageCache!;
  }

  /**
   * @private
   * Takes an object, stores it in the sessionStorageCache, and sets the object at the session
   * key in local storage, after stringifying it. If the set operation throws an error, then it
   * begins a retry loop of catching error, freeing up storage, setting value again.
   * @param obj
   */
  private setStorageForSession(obj: GwMap, errorStatePath?: string, errorStateValue?: any): void {
    this._sessionStorageCache = obj;
    let error: Error | undefined = undefined;
    try {
      window.localStorage.setItem(this.getStoragePathForSession(), JSON.stringify(obj));
    } catch (e) {
      error = e as Error;
      gwUtil.devlog((e as Error).message);
    }

    if (error && errorStatePath !== undefined) {
      this.storageIsFull(error);
      gwUtil.devlog("Trying to set storage again after error after clearing up local storage space. RETRY COUNT: ", this._retryCount);
      this.set(errorStatePath, errorStateValue);
      return;
    }

    this._retryCount = 0;
  }

  /**
   * @private
   * This is triggered on attempting to set storage and localStorage throws a full error of error
   * code 22. This method takes the loopCount and increments it, then tries various options to
   * free up local storage space. Based on the value of the loopCount:
   * 1. Deletes other local session storage.
   * 2. Deletes all dirty data storage.
   * 3. Deletes all local storage.
   * 4. Throws its hands up.
   * @param errLoopCount
   * @param e
   */
  private storageIsFull(err: Error): void {
    this._retryCount++;
    if (this._retryCount === 1) {
      // clear any other sessions
      for (const key in localStorage) {
        if (key !== this._sessionId) {
          window.localStorage.removeItem(key);
        }
      }
    } else if (this._retryCount === 2) {
      //deleting all data for other sessions didn't help us, so delete likely large chunks.
      this.remove(gwForm.FORM_EDIT_VALUES_BY_ID_KEY); // Dirty Data Storage
      this.remove(gwScroll.scrollKey); // Scroll Position Storage
    } else if (this._retryCount === 3) {
      //who knows what went wrong, so we'll wipe the whole thing just to be certain.
      window.localStorage.clear();
      this._sessionStorageCache = null;
    } else {
      //blowup, as we were unable to free up enough local space for the current set.
      throw err;
    }
  }

  /**
   * @private
   * @returns {*}
   */
  private getStoragePathForSession(): string {
    return this._sessionId;
  }
}

export const gwStorage = new GwStorage();
