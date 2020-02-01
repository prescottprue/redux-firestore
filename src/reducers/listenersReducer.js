import { omit } from 'lodash';
import { actionTypes } from '../constants';
import { combineReducers } from '../utils/reducers';

/**
 * Reducer for listeners ids. Changed by `SET_LISTENER` and `UNSET_LISTENER`
 * actions.
 * @param {object} [state={}] - Current listenersById redux state
 * @param {object} action - Object containing the action that was dispatched
 * @param {string} action.type - Type of action that was dispatched
 * @returns {object} listenersById state after reduction (used in listeners)
 * @private
 */
function listenersById(state = {}, { type, path, payload }) {
  switch (type) {
    case actionTypes.SET_LISTENER:
      return {
        ...state,
        [payload.name]: {
          name: payload.name,
          path,
        },
      };
    case actionTypes.UNSET_LISTENER:
      return omit(state, [payload.name]);
    default:
      return state;
  }
}

/**
 * Reducer for listeners state. Changed by `ERROR` and `LOGOUT` actions.
 * @param {object} [state=[]] - Current authError redux state
 * @param {object} action - Object containing the action that was dispatched
 * @param {string} action.type - Type of action that was dispatched
 * @returns {object} allListeners state after reduction (used in listeners)
 * @private
 */
function allListeners(state = [], { type, payload }) {
  switch (type) {
    case actionTypes.SET_LISTENER:
      return [...state, payload.name];
    case actionTypes.UNSET_LISTENER:
      return state.filter(name => name !== payload.name);
    default:
      return state;
  }
}

/**
 * Reducer for `listeners` state. Made from combination of listenersById and
 * allListeners reducers using combineReducers
 * @param {object} [state={}] - Current listeners state
 * @param {object} action - Object containing the action that was dispatched
 * @param {string} action.type - Type of action that was dispatched
 * @returns {object} Profile state after reduction
 */
const listenersReducer = combineReducers({
  byId: listenersById,
  allIds: allListeners,
});

export default listenersReducer;
