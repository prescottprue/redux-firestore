/**
 * Create a path array from path string
 * @param  {String} path - Path seperated with slashes
 * @return {Array} Path as Array
 * @private
 */
export function pathToArr(path) {
  return path ? path.split(/\//).filter(p => !!p) : [];
}

/**
 * Trim leading slash from path for use with state
 * @param  {String} path - Path seperated with slashes
 * @return {String} Path seperated with slashes
 * @private
 */
export function getSlashStrPath(path) {
  return pathToArr(path).join('/');
}

/**
 * Convert path with slashes to dot seperated path (for use with lodash get/set)
 * @param  {String} path - Path seperated with slashes
 * @return {String} Path seperated with dots
 * @private
 */
export function getDotStrPath(path) {
  return pathToArr(path).join('.');
}

/**
 * Combine reducers utility (abreveated version of redux's combineReducer).
 * Turns an object whose values are different reducer functions, into a single
 * reducer function.
 * @param {Object} reducers An object whose values correspond to different
 * reducer functions that need to be combined into one.
 * @returns {Function} A reducer function that invokes every reducer inside the
 * passed object, and builds a state object with the same shape.
 * @private
 */
export const combineReducers = reducers =>
  (state = {}, action) =>
    Object.keys(reducers).reduce(
      (nextState, key) => {
        nextState[key] = reducers[key]( // eslint-disable-line no-param-reassign
          state[key],
          action,
        );
        return nextState;
      },
      {},
    );

export const getFirestorePath = (action) => {
  if (!action.meta) {
    throw new Error('Meta is required to create firestore path');
  }
  const { meta: { collection, doc } } = action;
  return doc ? `${collection}/${doc}` : collection;
};


/**
 * Get path from meta data
 * @param  {Object} meta - Action meta data object
 * @param  {String} meta.collection - Name of Collection for which the action
 * is to be handled.
 * @param  {String} meta.doc - Name of Document for which the action is to be
 * handled.
 * @param  {Array} meta.subcollections - Subcollections of data
 * @param  {String} meta.storeAs - Another key within redux store that the
 * action associates with (used for storing data under a path different
 * from its collection/document)
 * @return {String} String path to be used within reducer
 */
export function pathFromMeta(meta) {
  const { collection, doc, subcollections, storeAs } = meta;
  let basePath = collection;
  if (storeAs) {
    return storeAs;
  }
  if (doc) {
    basePath += `.${doc}`;
  }
  if (!subcollections) {
    return basePath;
  }
  const mappedCollections = subcollections.map(pathFromMeta);
  return basePath.concat(`.${mappedCollections.join('.')}`);
}


/**
 * Encapsulate the idea of passing a new object as the first parameter
 * to Object.assign to ensure we correctly copy data instead of mutating
 * @param  {Object} oldObject - Object before update
 * @param  {Object} newValues - New values to add to the object
 * @return {Object} Object with new values
 */
export function updateObject(oldObject, newValues) {
  return Object.assign({}, oldObject, newValues);
}

/**
 * Update a single item within an array
 * @param  {Array} array - Array within which to update item
 * @param  {String} itemId - Id of item to update
 * @param  {Function} updateItemCallback - Callback dictacting how the item
 * is updated
 * @return {Array} Array with item updated
 */
export function updateItemInArray(array, itemId, updateItemCallback) {
  const updatedItems = array.map((item) => {
    if (item.id !== itemId) {
      // Since we only want to update one item, preserve all others as they are now
      return item;
    }

    // Use the provided callback to create an updated item
    const updatedItem = updateItemCallback(item);
    return updatedItem;
  });

  return updatedItems;
}
