import { isBoolean, pick, replace, trimStart, flatten } from 'lodash';

/**
 * Create a path array from path string
 * @param {string} path - Path seperated with slashes
 * @returns {Array} Path as Array
 * @private
 */
export function pathToArr(path) {
  return path ? path.split(/\//).filter(p => !!p) : [];
}

/**
 * Trim leading slash from path for use with state
 * @param {string} path - Path seperated with slashes
 * @returns {string} Path seperated with slashes
 * @private
 */
export function getSlashStrPath(path) {
  return trimStart(replace(path, /[.]/g, '/'), '/');
}

/**
 * Convert path with slashes to dot seperated path (for use with lodash get/set)
 * @param {string} path - Path seperated with slashes
 * @returns {string} Path seperated with dots
 * @private
 */
export function getDotStrPath(path) {
  return pathToArr(path).join('.');
}

/**
 * Combine reducers utility (abreveated version of redux's combineReducer).
 * Turns an object whose values are different reducer functions, into a single
 * reducer function.
 * @param {object} reducers An object whose values correspond to different
 * reducer functions that need to be combined into one.
 * @returns {Function} A reducer function that invokes every reducer inside the
 * passed object, and builds a state object with the same shape.
 * @private
 */
export function combineReducers(reducers) {
  return (state = {}, action) =>
    Object.keys(reducers).reduce((nextState, key) => {
      /* eslint-disable no-param-reassign */
      nextState[key] = reducers[key](state[key], action);
      /* eslint-enable no-param-reassign */
      return nextState;
    }, {});
}

/**
 * Get path from meta data. Path is used with lodash's setWith to set deep
 * data within reducers.
 * @param {object} meta - Action meta data object
 * @param {string} meta.collection - Name of Collection for which the action
 * is to be handled.
 * @param {string} meta.collectionGroup - Name of Collection Group for which
 * the action is to be handled.
 * @param {string} meta.doc - Name of Document for which the action is to be
 * handled.
 * @param {Array} meta.subcollections - Subcollections of data
 * @param {string} meta.storeAs - Another key within redux store that the
 * action associates with (used for storing data under a path different
 * from its collection/document)
 * @returns {Array} Array with path segments
 * @private
 */
export function pathFromMeta(meta) {
  if (!meta) {
    throw new Error('Action meta is required to build path for reducers.');
  }
  const { collection, collectionGroup, doc, subcollections, storeAs } = meta;
  if (storeAs) {
    // Use array here - if we don't we end up in trouble with docs that contain a dot
    return doc ? [storeAs, doc] : [storeAs];
  }
  if (meta.path) {
    return meta.path.split('/');
  }

  if (!collection && !collectionGroup) {
    throw new Error(
      'Collection or Collection Group is required to construct reducer path.',
    );
  }

  let basePath = [collection || collectionGroup];

  if (doc) {
    basePath = [...basePath, doc];
  }

  if (!subcollections) {
    return basePath;
  }

  const mappedCollections = subcollections.map(pathFromMeta);

  return [...basePath, ...flatten(mappedCollections)];
}

/**
 * Update a single item within an array with support for adding the item if
 * it does not already exist
 * @param {Array} array - Array within which to update item
 * @param {string} itemId - Id of item to update
 * @param {Function} updateItemCallback - Callback dictacting how the item
 * is updated
 * @returns {Array} Array with item updated
 * @private
 */
export function updateItemInArray(array, itemId, updateItemCallback) {
  let matchFound = false;
  const modified = Array.isArray(array)
    ? array.map(item => {
        // Preserve items that do not have matching ids
        if (!item || item.id !== itemId) {
          return item;
        }
        matchFound = true;
        // Use the provided callback to create an updated item
        const updatedItem = updateItemCallback(item);
        return updatedItem;
      })
    : [];
  if (!matchFound) {
    modified.push(updateItemCallback({ id: itemId }));
  }
  return modified;
}

/**
 * A function for expressing reducers as an object mapping from action
 * types to handlers (mentioned in redux docs:
 * https://redux.js.org/recipes/reducing-boilerplate#generating-reducers)
 * @param {any} initialState - Initial state of reducer
 * @param {object} handlers - Mapping of action types to handlers
 * @returns {Function} Reducer function which uses each handler only when
 * the action type matches.
 */
export function createReducer(initialState, handlers) {
  return function reducer(state = initialState, action) {
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
 * @param {object} state - slice of redux state to be preserved
 * @param {boolean|Function|Array} preserveSetting [description]
 * @param {object} nextState - What state would have been set to if preserve
 * was not occuring.
 * @returns {object} Slice of state with values preserved
 * @private
 */
export function preserveValuesFromState(state, preserveSetting, nextState) {
  // Return original state if preserve is true
  if (isBoolean(preserveSetting)) {
    return nextState ? { ...state, ...nextState } : state;
  }

  // Return result of function if preserve is a function
  if (typeof preserveSetting === 'function') {
    return preserveSetting(state, nextState);
  }

  // Return keys listed within array
  if (Array.isArray(preserveSetting)) {
    return pick(state, preserveSetting); // pick returns a new object
  }

  throw new Error(
    'Invalid preserve parameter. It must be an Object or an Array.',
  );
}
