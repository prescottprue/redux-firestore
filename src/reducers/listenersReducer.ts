import { combineReducers } from 'redux';
import { omit } from 'lodash';
import { actionTypes } from '../constants';
import { ReduxFirestoreAction } from '../types';

type AllListenerIdsState = (string | undefined)[]

export interface ListenersByIdState {
  [k: string]: any
}

export interface ListenersState {
  byId: ListenersByIdState
  allIds: AllListenerIdsState
}

/**
 * Reducer for listeners ids. Changed by `SET_LISTENER` and `UNSET_LISTENER`
 * actions.
 * @param [state={}] - Current listenersById redux state
 * @param action - Object containing the action that was dispatched
 * @param action.type - Type of action that was dispatched
 * @returns listenersById state after reduction (used in listeners)
 * @private
 */
function listenersById(state = {}, action: ReduxFirestoreAction): ListenersByIdState {
  const { type, path, payload } = action
  if (!payload.name) {
    return state
  }
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
 * @param [state=[]] - Current authError redux state
 * @param action - Object containing the action that was dispatched
 * @param action.type - Type of action that was dispatched
 * @returns allListeners state after reduction (used in listeners)
 * @private
 */
function allListeners(state: any, action: ReduxFirestoreAction): AllListenerIdsState {
  const { type, payload } = action
  switch (type) {
    case actionTypes.SET_LISTENER:
      return [...state, payload.name];
    case actionTypes.UNSET_LISTENER:
      return state.filter((name: string) => name !== payload.name);
    default:
      return state;
  }
}

/**
 * Reducer for `listeners` state. Made from combination of listenersById and
 * allListeners reducers using combineReducers
 * @param [state={}] - Current listeners state
 * @param action - Object containing the action that was dispatched
 * @param ction.type - Type of action that was dispatched
 * @returns Profile state after reduction
 */
const listenersReducer = combineReducers({
  byId: listenersById,
  allIds: allListeners,
});

export default listenersReducer;
