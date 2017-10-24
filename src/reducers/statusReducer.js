import { actionTypes } from '../constants';
import { getSlashStrPath, combineReducers } from '../utils/reducers';

const { START, SET, NO_VALUE } = actionTypes;

/**
 * Reducer for requesting state.Changed by `START`, `NO_VALUE`, and `SET` actions.
 * @param  {Object} [state={}] - Current requesting redux state
 * @param  {Object} action - Object containing the action that was dispatched
 * @param  {String} action.type - Type of action that was dispatched
 * @param  {String} action.path - Path of action that was dispatched
 * @return {Object} Profile state after reduction
 */
export const requestingReducer = (state = {}, { type, path }) => {
  switch (type) {
    case START:
      return {
        ...state,
        [getSlashStrPath(path)]: true,
      };
    case NO_VALUE:
    case SET:
      return {
        ...state,
        [getSlashStrPath(path)]: false,
      };
    default:
      return state;
  }
};

/**
 * Reducer for requested state. Changed by `START`, `NO_VALUE`, and `SET` actions.
 * @param  {Object} [state={}] - Current requested redux state
 * @param  {Object} action - Object containing the action that was dispatched
 * @param  {String} action.type - Type of action that was dispatched
 * @param  {String} action.path - Path of action that was dispatched
 * @return {Object} Profile state after reduction
 */
export const requestedReducer = (state = {}, { type, path }) => {
  switch (type) {
    case START:
      return {
        ...state,
        [getSlashStrPath(path)]: false,
      };
    case NO_VALUE:
    case SET:
      return {
        ...state,
        [getSlashStrPath(path)]: true,
      };
    default:
      return state;
  }
};

/**
 * Reducer for timestamps state. Changed by `START`, `NO_VALUE`, and `SET` actions.
 * @param  {Object} [state={}] - Current timestamps redux state
 * @param  {Object} action - Object containing the action that was dispatched
 * @param  {String} action.type - Type of action that was dispatched
 * @param  {String} action.path - Path of action that was dispatched
 * @return {Object} Profile state after reduction
 */
export const timestampsReducer = (state = {}, { type, path }) => {
  switch (type) {
    case START:
    case NO_VALUE:
    case SET:
      return {
        ...state,
        [getSlashStrPath(path)]: Date.now(),
      };
    default:
      return state;
  }
};

/**
 * @name statusReducer
 * Reducer for `status` state. Made from requestingReducer ,requestedReducer,
 * and timestampsReducer reducers combined together using combineReducers.
 * @param  {Object} [state={}] - Current listeners state
 * @param  {Object} action - Object containing the action that was dispatched
 * @param  {String} action.type - Type of action that was dispatched
 * @return {Object} Profile state after reduction
 */
export default combineReducers({
  requesting: requestingReducer,
  requested: requestedReducer,
  timestamps: timestampsReducer,
});
