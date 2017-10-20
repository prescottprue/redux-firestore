import { omit } from 'lodash';
import { actionTypes } from '../constants';
import { combineReducers } from '../utils/reducers';

/**
 * Reducer for listeners ids. Changed by `SET_LISTENER` and `UNSET_LISTENER`
 * actions.
 * @param  {Object} [state={}] - Current listenersById redux state
 * @param  {Object} action - Object containing the action that was dispatched
 * @param  {String} action.type - Type of action that was dispatched
 * @return {Object} listenersById state after reduction (used in listeners)
 * @private
 */
const listenersById = (state = {}, { type, path, payload }) => {
  switch (type) {
    case actionTypes.SET_LISTENER:
      return {
        ...state,
        [payload.id]: {
          id: payload.id,
          path,
        },
      };
    case actionTypes.UNSET_LISTENER:
      return omit(state, [payload.id]);
    default: return state;
  }
};

/**
 * Reducer for listeners state. Changed by `ERROR`
 * and `LOGOUT` actions.
 * @param  {Object} [state=[]] - Current authError redux state
 * @param  {Object} action - Object containing the action that was dispatched
 * @param  {String} action.type - Type of action that was dispatched
 * @return {Object} allListeners state after reduction (used in listeners)
 * @private
 */
const allListeners = (state = [], { type, payload }) => {
  switch (type) {
    case actionTypes.SET_LISTENER:
      return [...state, payload.id];
    case actionTypes.UNSET_LISTENER:
      return state.filter(lId => lId !== payload.id);
    default: return state;
  }
};

/**
 * Reducer for `listeners` state. Made from combination of listenersById and
 * allListeners reducers using combineReducers
 * @param  {Object} [state={}] - Current listeners state
 * @param  {Object} action - Object containing the action that was dispatched
 * @param  {String} action.type - Type of action that was dispatched
 * @return {Object} Profile state after reduction
 */
const listenersReducer = combineReducers({
  byId: listenersById,
  allIds: allListeners,
});

export default listenersReducer;
