import { actionTypes } from '../constants';
import { combineReducers, pathFromMeta } from '../utils/reducers';

const { CLEAR_ERRORS, CLEAR_ERROR, LISTENER_ERROR, ERROR } = actionTypes;

/**
 * Reducer for errors state. Changed by `ERROR`
 * and `CLEAR_ERRORS` actions.
 * @param  {Object} [state=[]] - Current authError redux state
 * @param  {Object} action - Object containing the action that was dispatched
 * @param  {String} action.type - Type of action that was dispatched
 * @return {Object} Profile state after reduction
 */
function errorsAllIds(state = [], { meta, type }) {
  switch (type) {
    case LISTENER_ERROR:
    case ERROR:
      if (state.indexOf(pathFromMeta(meta)) !== -1) {
        return state;
      }
      return [...state, pathFromMeta(meta)];
    case CLEAR_ERRORS:
      return [];
    case CLEAR_ERROR:
      return state.filter(lId => lId !== pathFromMeta(meta));
    default:
      return state;
  }
}

/**
 * Reducer for errors state. Changed by `ERROR`
 * and `CLEAR_ERRORS` actions.
 * @param  {Object} [state=[]] - Current authError redux state
 * @param  {Object} action - Object containing the action that was dispatched
 * @param  {String} action.type - Type of action that was dispatched
 * @return {Object} Profile state after reduction
 */
function errorsByQuery(state = {}, { meta, payload, type }) {
  switch (type) {
    case ERROR:
    case LISTENER_ERROR:
      return {
        ...state,
        [pathFromMeta(meta)]: payload,
      };
    case CLEAR_ERROR:
      return {
        ...state,
        [pathFromMeta(meta)]: null,
      };
    default:
      return state;
  }
}

const errorsReducer = combineReducers({
  byQuery: errorsByQuery,
  allIds: errorsAllIds,
});

export default errorsReducer;
