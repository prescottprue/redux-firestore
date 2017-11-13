import { pick, assign, get } from 'lodash';
import { setWith } from 'lodash/fp';
import { actionTypes } from '../constants';

const { CLEAR_DATA, GET_SUCCESS, LISTENER_RESPONSE } = actionTypes;

const pathFromMeta = ({ collection, doc, subcollections }) => {
  const basePath = collection;
  if (doc) {
    basePath.concat(doc);
  }
  if (!subcollections) {
    return basePath;
  }
  const mappedCollections = subcollections.map(pathFromMeta);
  return basePath.concat(mappedCollections.join('.'));
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
      if (!action.payload || action.payload.data === undefined) {
        return state;
      }
      if (action.merge) {
        return {
          ...state,
          [action.meta.collection]: state[action.meta.collection]
            ? { ...state[action.meta.collection], ...action.payload.data }
            : action.payload.data,
        };
      }
      const previousData = get(state, pathFromMeta(action.meta));
      if (!previousData) {
        return setWith(Object, pathFromMeta(action.meta), action.payload.data, state);
      }
      const mergedData = assign(previousData, action.payload.data);
      return setWith(Object, pathFromMeta(action.meta), mergedData, state);
    case CLEAR_DATA:
      // support keeping data when logging out - #125
      if (action.preserve) {
        return pick(state, action.preserve); // pick returns a new object
      }
      return {};
    default:
      return state;
  }
}
