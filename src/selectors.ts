import { get } from 'lodash';
import { getQueryName } from './utils/query';
import { QueryConfig } from './types';

/**
 * Create state value selector for firestore data by key
 * @param queryConfig - Configuration for query
 * @returns Data selected from firestore data state
 */
export function firestoreDataSelector(queryConfig: QueryConfig) {
  return (state: any, getPath: string): any => {
    const queryName = getQueryName(queryConfig, { onlySubcollections: true });
    if (!getPath) {
      return state.firestore.data[queryName];
    }
    return get(state.firestore.data[queryName], getPath);
  };
}

/**
 * Create state value selector for firestore ordered data (array)
 * @param queryConfig - Configuration for query
 * @returns Data selected from firestore ordered state
 */
export function firestoreOrderedSelector(queryConfig: QueryConfig) {
  return (state: any, getPath: string): any => {
    const queryName = getQueryName(queryConfig);
    if (!getPath) {
      return state.firestore.ordered[queryName];
    }
    return get(state.firestore.ordered[queryName], getPath);
  };
}
