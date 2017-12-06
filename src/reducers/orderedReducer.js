import { pick, get, first } from 'lodash';
import { actionTypes } from '../constants';
import { updateItemInArray, updateObject } from '../utils/reducers';

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
  // TODO: Make this recursive so that is supports multiple subcollections
  return {
    ...state,
    [action.meta.collection]: updateItemInArray(
      state[action.meta.collection] || [],
      action.meta.doc,
      item => updateObject(
        item,
        subcollection
          ? { [get(subcollection, 'collection')]: action.payload.ordered }
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
      if (action.meta.doc) {
        return updateDocInOrdered(state, action);
      }
      return {
        ...state,
        [action.meta.collection]: action.payload.ordered,
      };
    case CLEAR_DATA:
      // support keeping data when logging out - #125
      if (action.preserve) {
        return pick(state, action.preserve); // pick returns a new object
      }
      return state;
    default:
      return state;
  }
}
