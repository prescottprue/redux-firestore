import {
  isFunction,
  isBoolean,
  isArray,
  pick,
  replace,
  trimStart,
} from 'lodash';
import { AnyAction } from 'redux';
import { PreserveSetting } from '../types';

/**
 * Create a path array from path string
 * @param path - Path seperated with slashes
 * @returns Path as Array
 * @private
 */
export function pathToArr(path: string): string[] {
  return path ? path.split(/\//).filter(p => !!p) : [];
}

/**
 * Trim leading slash from path for use with state
 * @param path - Path seperated with slashes
 * @returns Path seperated with slashes
 * @private
 */
export function getSlashStrPath(path: string): string {
  return trimStart(replace(path, /[.]/g, '/'), '/');
}

/**
 * Convert path with slashes to dot seperated path (for use with lodash get/set)
 * @param path - Path seperated with slashes
 * @returns Path seperated with dots
 * @private
 */
export function getDotStrPath(path: string): string {
  return pathToArr(path).join('.');
}

/**
 * Update a single item within an array with support for adding the item if
 * it does not already exist
 * @param array - Array within which to update item
 * @param itemId - Id of item to update
 * @param updateItemCallback - Callback dictacting how the item
 * is updated
 * @returns Array with item updated
 * @private
 */
export function updateItemInArray(array: any[] | undefined, itemId: string | undefined, updateItemCallback: (item: any) => any): any[] {
  let matchFound = false;
  if (!array || !array.length) {
    return [];
  }
  const modified = array.map(item => {
    // Preserve items that do not have matching ids
    if (!item || item.id !== itemId) {
      return item;
    }
    matchFound = true;
    // Use the provided callback to create an updated item
    const updatedItem = updateItemCallback(item);
    return updatedItem;
  });
  if (!matchFound) {
    modified.push(updateItemCallback({ id: itemId }));
  }
  return modified;
}

/**
 * A function for expressing reducers as an object mapping from action
 * types to handlers (mentioned in redux docs:
 * https://redux.js.org/recipes/reducing-boilerplate#generating-reducers)
 * @param initialState - Initial state of reducer
 * @param handlers - Mapping of action types to handlers
 * @returns Reducer function which uses each handler only when
 * the action type matches.
 */
export function createReducer(initialState: any, handlers: any): (state: any, action: AnyAction) => any {
  return function reducer(state = initialState, action: AnyAction) {
    /* eslint-disable no-prototype-builtins */
    if (handlers.hasOwnProperty(action.type)) {
      /* eslint-enable no-prototype-builtins */
      return handlers[action.type](state, action);
    }
    return state;
  };
}

/**
 * Preserve slice of state based on preserve settings for that slice. Settings
 * for support can be any of type `Boolean`, `Function`, or `Array`.
 * @param state - slice of redux state to be preserved
 * @param preserveSetting - Settings for which values to preserve
 * @param nextState - What state would have been set to if preserve
 * was not occuring.
 * @return Slice of state with values preserved
 * @private
 */
export function preserveValuesFromState(state: any, preserveSetting: PreserveSetting, nextState: any): any {
  // Return original state if preserve is true
  if (isBoolean(preserveSetting)) {
    return nextState ? { ...state, ...nextState } : state;
  }

  // Return result of function if preserve is a function
  if (isFunction(preserveSetting)) {
    return preserveSetting(state, nextState);
  }

  // Return keys listed within array
  if (isArray(preserveSetting)) {
    return pick(state, preserveSetting); // pick returns a new object
  }

  throw new Error(
    'Invalid preserve parameter. It must be an Object or an Array.',
  );
}
