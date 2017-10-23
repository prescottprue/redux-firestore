import { pick } from 'lodash';
import { actionTypes } from '../constants';

const { CLEAR_DATA, GET_SUCCESS, LISTENER_RESPONSE } = actionTypes;

/**
 * Creates reducer for data state. Used to create data and ordered reducers.
 * Changed by `SET` or `SET_ORDERED` (if actionKey === 'ordered'), `MERGE`,
 * `NO_VALUE`, and `LOGOUT` actions.
 * @param  {Object} [state={}] - Current data redux state
 * @param  {Object} action - Object containing the action that was dispatched
 * @param  {String} action.type - Type of action that was dispatched
 * @param  {String} action.path - Path of action that was dispatched
 * @return {Object} Data state after reduction
 * @private
 */
export const createDataReducer = (actionKey = 'data') => (state = {}, action) => {
  switch (action.type) {
    case GET_SUCCESS:
    case LISTENER_RESPONSE:
      if (!action.payload || !action.payload[actionKey]) {
        return state;
      }
      return {
        ...state,
        [action.meta.collection]: state[action.meta.collection]
          ? { ...state[action.meta.collection], ...action.payload[actionKey] }
          : action.payload[actionKey],
      };
    case CLEAR_DATA:
      // support keeping data when logging out - #125
      if (action.preserve) {
        return pick(state, action.preserve); // pick returns a new object
      }
      return actionKey === 'ordered' ? [] : {};
    default:
      return state;
  }
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

export default createDataReducer();
