import { first, size, get, unionBy } from 'lodash';
import { merge as mergeObjects } from 'lodash/fp';
import { actionTypes } from '../constants';
import { updateItemInArray, preserveValuesFromState } from '../utils/reducers';

const {
  GET_SUCCESS,
  LISTENER_RESPONSE,
  CLEAR_DATA,
  DOCUMENT_REMOVED,
  DELETE_SUCCESS,
  DOCUMENT_CHANGE,
} = actionTypes;

function addItemAtIndex(arr, from, to, item) {
  arr = arr.slice(); // eslint-disable-line no-param-reassign
  if (from === -1 || from === to) {
    arr.splice(to, 0, item);
  } else {
    arr.splice(
      to < 0 ? arr.length + to : to,
      0,
      item || arr.splice(from, 1)[0],
    );
  }
  return arr;
}

function moveDocInOrdered(state, action) {
  const storeUnderKey = action.meta.storeAs || action.meta.collection;
  const { oldIndex, newIndex } = get(action, 'payload.ordered', {});
  const data = get(state, storeUnderKey) || [];
  return {
    ...state,
    [storeUnderKey]: addItemAtIndex(
      data,
      oldIndex,
      newIndex,
      action.payload.data,
    ),
  };
}

/**
 * Update a document within an array from the ordered state
 * @param  {Object} [state={}] - Current ordered redux state
 * @param  {Object} action - Object containing the action that was dispatched
 * @param  {String} action.type - Type of action that was dispatched
 * @param  {Object} action.meta - Meta data of action
 * @param  {String} action.meta.collection - Name of the collection for the
 * data being passed to the reducer.
 * @param  {Array} action.meta.subcollections - Subcollections which the action
 * @param  {String} action.payload - Data from within the action
 * @return {Object} Ordered state after reduction
 */
function updateDocInOrdered(state, action, overrideValue) {
  const itemToAdd = first(action.payload.ordered);
  const subcollection = first(action.meta.subcollections);
  const storeUnderKey = action.meta.storeAs || action.meta.collection;
  return {
    ...state,
    [storeUnderKey]: updateItemInArray(
      state[storeUnderKey] || [],
      action.meta.doc,
      item =>
        // Use merge to preserve existing subcollections
        mergeObjects(
          item,
          subcollection
            ? {
                [subcollection.collection]:
                  overrideValue || action.payload.ordered,
              }
            : itemToAdd,
        ),
    ),
  };
}

/**
 * Reducer for ordered state.
 * @param  {Object} [state={}] - Current ordered redux state
 * @param  {Object} action - Object containing the action that was dispatched
 * @param  {String} action.type - Type of action that was dispatched
 * @param  {String} action.meta.collection - Name of Collection which the action
 * associates with
 * @param  {String} action.meta.doc - Name of Document which the action
 * associates with
 * @param  {Array} action.meta.subcollections - Subcollections which the action
 * associates with
 * @param  {String} action.meta.storeAs - Another key within redux store that the
 * action associates with (used for storing data under a path different
 * from its collection/document)
 * @param  {Object} action.payload - Object containing data associated with
 * action
 * @param  {Array} action.payload.ordered - Ordered Array Data associated with
 * action
 * @return {Object} Ordered state after reduction
 */
export default function orderedReducer(state = {}, action) {
  switch (action.type) {
    case GET_SUCCESS:
    case LISTENER_RESPONSE:
      if (!action.payload || !action.payload.ordered) {
        return state;
      }
      const { meta, merge = { doc: true, collection: true } } = action;
      const parentPath = meta.storeAs || meta.collection;
      // Handle doc update (update item in array instead of whole array)
      if (meta.doc && merge.doc && size(get(state, parentPath))) {
        // Merge if data already exists
        // Merge with existing ordered array if collection merge enabled
        return updateDocInOrdered(state, action);
      }
      const parentData = get(state, parentPath);
      // Merge with existing ordered array if collection merge enabled
      if (merge.collection && size(parentData)) {
        return {
          ...state,
          [parentPath]: unionBy(parentData, action.payload.ordered, 'id'),
        };
      }
      return {
        ...state,
        [parentPath]: action.payload.ordered,
      };
    case CLEAR_DATA:
      // support keeping data when logging out - #125
      if (action.preserve && action.preserve.ordered) {
        return preserveValuesFromState(state, action.preserve.ordered, {});
      }
      return {};
    case DOCUMENT_CHANGE:
      return moveDocInOrdered(state, action);
    case DELETE_SUCCESS:
    case DOCUMENT_REMOVED:
      return updateDocInOrdered(state, action, null);
    // TODO: DELETE_SUCCESS that removes item from array in a way that is
    // configurable and aware of listeners (v0.3.0)
    // TODO: LISTENER_ERROR that sets null or removes items in a way that is
    // configurable (v0.3.0)
    default:
      return state;
  }
}
