import { pick } from 'lodash';
import { actionTypes } from '../constants';

const { GET_SUCCESS, LISTENER_RESPONSE, CLEAR_DATA } = actionTypes;

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
