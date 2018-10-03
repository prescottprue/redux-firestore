import { get } from 'lodash';
import { getQueryName } from './utils/query';

/**
 * Create state value selector for firestore data by key
 * @param {Object|String} queryConfig - Configuration for query
 */
export function firestoreDataSelector(queryConfig) {
  return (state, getPath) => {
    const queryName = getQueryName(queryConfig, { onlySubcollections: true });
    if (!getPath) {
      return state.firestore.data[queryName];
    }
    return get(state.firestore.data[queryName], getPath);
  };
}

/**
 * Create state value selector for firestore ordered data (array)
 * @param {Object|String} queryConfig - Configuration for query
 */
export function firestoreOrderedSelector(queryConfig) {
  return (state, getPath) => {
    const queryName = getQueryName(queryConfig);
    if (!getPath) {
      return state.firestore.ordered[queryName];
    }
    return get(state.firestore.ordered[queryName], getPath);
  };
}
