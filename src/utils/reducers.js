/**
 * Create a path array from path string
 * @param  {String} path - Path seperated with slashes
 * @return {Array} Path as Array
 * @private
 */
export const pathToArr = path => path ? path.split(/\//).filter(p => !!p) : [];

/**
 * Trim leading slash from path for use with state
 * @param  {String} path - Path seperated with slashes
 * @return {String} Path seperated with slashes
 * @private
 */
export const getSlashStrPath = path => pathToArr(path).join('/');

/**
 * Convert path with slashes to dot seperated path (for use with lodash get/set)
 * @param  {String} path - Path seperated with slashes
 * @return {String} Path seperated with dots
 * @private
 */
export const getDotStrPath = path => pathToArr(path).join('.');

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
