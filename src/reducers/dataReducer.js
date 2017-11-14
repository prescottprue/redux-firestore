import { pick, get } from 'lodash';
import { setWith, assign } from 'lodash/fp';
import { actionTypes } from '../constants';

const { CLEAR_DATA, GET_SUCCESS, LISTENER_RESPONSE } = actionTypes;

const pathFromMeta = ({ collection, doc, subcollections }) => {
  let basePath = collection;
  if (doc) {
    basePath += `.${doc}`;
  }
  if (!subcollections) {
    return basePath;
  }
  const mappedCollections = subcollections.map(pathFromMeta);
  return basePath.concat(`.${mappedCollections.join('.')}`);
};

/**
 * @name dataReducer
 * Reducer for data state.
 * @param  {Object} [state={}] - Current data redux state
 * @param  {Object} action - Object containing the action that was dispatched
 * @param  {String} action.type - Type of action that was dispatched
 * @param  {Object} action.meta - Meta data of action
 * @param  {String} action.path - Path of action that was dispatched
 * @return {Object} Data state after reduction
 */
export default function dataReducer(state = {}, action) {
  switch (action.type) {
    case GET_SUCCESS:
    case LISTENER_RESPONSE:
      const { meta, payload, preserve } = action;
      if (!payload || payload.data === undefined) {
        return state;
      }
      const previousData = get(state, pathFromMeta(meta));
      // Do not merge if no existing data or if meta contains subcollections
      if (!previousData || meta.subcollections) {
        return setWith(Object, pathFromMeta(meta), payload.data, state);
      }
      // Merge with existing data
      const mergedData = assign(
        previousData,
        meta.doc ? get(payload.data, meta.doc) : payload.data,
      );
      return setWith(Object, pathFromMeta(meta), mergedData, state);
    case CLEAR_DATA:
      // support keeping data when logging out - #125
      if (preserve) {
        return pick(state, preserve); // pick returns a new object
      }
      return {};
    default:
      return state;
  }
}
