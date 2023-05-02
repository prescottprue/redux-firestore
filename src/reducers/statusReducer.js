import { actionTypes } from '../constants';
import { getSlashStrPath, combineReducers } from '../utils/reducers';
import { getQueryName } from '../utils/query';

const { SET_LISTENER, UNSET_LISTENER, LISTENER_ERROR, LISTENER_RESPONSE } =
  actionTypes;

/**
 * Reducer for requesting state.Changed by `START`, `NO_VALUE`, and `SET` actions.
 * @param {object} [state={}] - Current requesting redux state
 * @param {object} action - Object containing the action that was dispatched
 * @param {string} action.type - Type of action that was dispatched
 * @param {string} action.meta - The meta information of the query
 * @returns {object} Profile state after reduction
 */
export function requestingReducer(state = {}, { type, meta }) {
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
 * @param {object} [state={}] - Current requested redux state
 * @param {object} action - Object containing the action that was dispatched
 * @param {string} action.type - Type of action that was dispatched
 * @param {string} action.meta - The meta information of the query
 * @returns {object} Profile state after reduction
 */
export function requestedReducer(state = {}, { type, meta }) {
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
 * @param {object} [state={}] - Current timestamps redux state
 * @param {object} action - Object containing the action that was dispatched
 * @param {string} action.type - Type of action that was dispatched
 * @param {object} action.meta - Metadata for action
 * @returns {object} Profile state after reduction
 */
export function timestampsReducer(state = {}, { type, meta }) {
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
 * @param {object} [state={}] - Current listeners state
 * @param {object} action - Object containing the action that was dispatched
 * @param {string} action.type - Type of action that was dispatched
 * @returns {object} Profile state after reduction
 */
export default combineReducers({
  requesting: requestingReducer,
  requested: requestedReducer,
  timestamps: timestampsReducer,
});
