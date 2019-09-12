import { combineReducers } from 'redux';
import { TimestampsState, RequestedState, RequestingState } from './../types'
import { actionTypes } from '../constants';
import { getSlashStrPath } from '../utils/reducers';
import { getQueryName } from '../utils/query';
import { ReduxFirestoreAction } from '../types';

const {
  SET_LISTENER,
  UNSET_LISTENER,
  LISTENER_ERROR,
  LISTENER_RESPONSE,
} = actionTypes;

/**
 * Reducer for requesting state.Changed by `START`, `NO_VALUE`, and `SET` actions.
 * @param [state={}] - Current requesting redux state
 * @param action - Object containing the action that was dispatched
 * @param action.type - Type of action that was dispatched
 * @param action.path - Path of action that was dispatched
 * @param action.meta - The meta information of the query
 * @returns Profile state after reduction
 */
export function requestingReducer(state: RequestingState = {}, action: ReduxFirestoreAction): RequestingState {
  const { type, meta } = action
  switch (type) {
    case SET_LISTENER:
      return {
        ...state,
        [getSlashStrPath(getQueryName(meta))]: true,
      };
    case LISTENER_ERROR:
    case LISTENER_RESPONSE:
    case UNSET_LISTENER:
      return {
        ...state,
        [getSlashStrPath(getQueryName(meta))]: false,
      };
    default:
      return state;
  }
}

/**
 * Reducer for requested state. Changed by `START`, `NO_VALUE`, and `SET` actions.
 * @param [state={}] - Current requested redux state
 * @param action - Object containing the action that was dispatched
 * @param action.type - Type of action that was dispatched
 * @param action.path - Path of action that was dispatched
 * @param action.meta - The meta information of the query
 * @returns Profile state after reduction
 */
export function requestedReducer(state: RequestedState = {}, action: ReduxFirestoreAction): RequestedState {
  const { type, meta } = action
  switch (type) {
    case SET_LISTENER:
    case UNSET_LISTENER:
      return {
        ...state,
        [getQueryName(meta)]: false,
      };
    case LISTENER_ERROR:
    case LISTENER_RESPONSE:
      return {
        ...state,
        [getQueryName(meta)]: true,
      };
    default:
      return state;
  }
}

/**
 * Reducer for timestamps state. Changed by `START`, `NO_VALUE`, and `SET` actions.
 * @param [state={}] - Current timestamps redux state
 * @param action - Object containing the action that was dispatched
 * @param action.type - Type of action that was dispatched
 * @param action.path - Path of action that was dispatched
 * @returns Profile state after reduction
 */
export function timestampsReducer(state = {}, action: ReduxFirestoreAction): TimestampsState {
  const { type, meta } = action
  switch (type) {
    case SET_LISTENER:
      return {
        ...state,
        [getQueryName(meta)]: Date.now(),
      };
    default:
      return state;
  }
}

/**
 * @name statusReducer
 * Reducer for `status` state. Made from requestingReducer ,requestedReducer,
 * and timestampsReducer reducers combined together using combineReducers.
 * @param [state={}] - Current listeners state
 * @param action - Object containing the action that was dispatched
 * @param action.type - Type of action that was dispatched
 * @returns Profile state after reduction
 */
export default combineReducers({
  requesting: requestingReducer,
  requested: requestedReducer,
  timestamps: timestampsReducer,
});
