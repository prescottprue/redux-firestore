import { first, size, get, mergeWith, isArray } from 'lodash';
import { merge } from 'lodash/fp';
import { actionTypes } from '../constants';
import { updateItemInArray, preserveValuesFromState } from '../utils/reducers';

const { GET_SUCCESS, LISTENER_RESPONSE, CLEAR_DATA } = actionTypes;

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
function updateDocInOrdered(state, action) {
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
        merge(
          item,
          subcollection
            ? { [subcollection.collection]: action.payload.ordered }
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
      // TODO: Support merging
      const getPath = action.meta.storeAs || action.meta.collection;
      // Handle doc update (update item in array instead of whole array)
      if (action.meta.doc) {
        // Merge if data already exists
        if (size(get(state, getPath))) {
          return updateDocInOrdered(state, action);
        }
      }
      const currentData = get(state, getPath);
      // Merge if data already exists
      if (size(currentData)) {
        return {
          ...state,
          [action.meta.storeAs || action.meta.collection]: mergeWith(
            currentData,
            action.payload.ordered,
            /* eslint-disable consistent-return */
            (objValue, srcValue) => {
              if (isArray(objValue)) {
                return objValue.concat(srcValue);
              }
            },
            /* eslint-enable consistent-return */
          ),
        };
      }
      return {
        ...state,
        [action.meta.storeAs || action.meta.collection]: action.payload.ordered,
      };
    case CLEAR_DATA:
      // support keeping data when logging out - #125
      if (action.preserve && action.preserve.ordered) {
        return preserveValuesFromState(state, action.preserve.ordered, {});
      }
      return {};
    // TODO: DELETE_SUCCESS that removes item from array in a way that is
    // configurable and aware of listeners (v0.3.0)
    // TODO: LISTENER_ERROR that sets null or removes items in a way that is
    // configurable (v0.3.0)
    default:
      return state;
  }
}
