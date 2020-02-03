import produce from 'immer';
import { set, get, unset } from 'lodash';
import { actionTypes } from '../constants';
import { getBaseQueryName } from '../utils/query';

/**
 * Checks whether or not an action is composable
 * @param {object} action - Object containing the action that was dispatched
 * @returns {boolean} Whether or not the action is composable
 */
export function isComposable(action) {
  return !!get(action, 'meta.where') && !!get(action, 'meta.collection');
}

/**
 * Reducer for queries state
 * @param {object} [state={}] - Current listenersById redux state
 * @param {object} action - Object containing the action that was dispatched
 * @param {string} action.type - Type of action that was dispatched
 * @returns {object} Queries state
 */
export default function queriesReducer(state = {}, action) {
  return produce(state, draft => {
    if (!isComposable(action)) {
      return state;
    }

    const key = getBaseQueryName(action.meta); // get a unique key for the query

    switch (action.type) {
      case actionTypes.GET_SUCCESS:
      case actionTypes.LISTENER_RESPONSE:
        draft[key] = { data: action.payload.data, ...action.meta }; // eslint-disable-line no-param-reassign
        return draft;
      case actionTypes.UNSET_LISTENER:
        // Deleting this key complicates recomposing the result -
        // since it is no longer defined, it will not be overwritten.
        // Emptying out the data is a pragmatic compromise.
        if (draft[key]) {
          draft[key].data = undefined; // eslint-disable-line no-param-reassign
        }

        return draft;
      case actionTypes.DOCUMENT_ADDED:
      case actionTypes.DOCUMENT_MODIFIED:
        set(draft, [key, 'data', action.meta.doc], action.payload.data);
        return draft;
      case actionTypes.DOCUMENT_REMOVED:
      case actionTypes.DELETE_SUCCESS:
        unset(draft, [key, 'data', action.meta.doc]);
        return draft;
      default:
        return state;
    }
  });
}
