import { pick, get, first } from 'lodash';
import { actionTypes } from '../constants';

const { GET_SUCCESS, LISTENER_RESPONSE, CLEAR_DATA } = actionTypes;

function updateObject(oldObject, newValues) {
    // Encapsulate the idea of passing a new object as the first parameter
    // to Object.assign to ensure we correctly copy data instead of mutating
  return Object.assign({}, oldObject, newValues);
}

function updateItemInArray(array, itemId, updateItemCallback) {
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


/**
 * Reducer for ordered state.
 * @param  {Object} [state={}] - Current ordered redux state
 * @param  {Object} action - Object containing the action that was dispatched
 * @param  {String} action.type - Type of action that was dispatched
 * @param  {String} action.path - Path of action that was dispatched
 * @return {Object} Data state after reduction
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
        const itemToAdd = first(action.payload.ordered);
        const subcollection = first(action.meta.subcollections);
        // TODO: Make this recursive so that is supports multiple subcollections
        return {
          ...state,
          [action.meta.collection]: updateItemInArray(
            state[action.meta.collection] || [],
            action.meta.doc,
            item => updateObject(item, subcollection ? { [get(subcollection, 'collection')]: action.payload.ordered } : itemToAdd),
          ),
        };
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
