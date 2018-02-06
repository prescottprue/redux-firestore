import { actionTypes } from '../constants';
import { combineReducers, pathFromMeta } from '../utils/reducers';

const {
  CLEAR_ERRORS,
  CLEAR_ERROR,
  LOGIN_ERROR,
  LISTENER_ERROR,
  ERROR,
} = actionTypes;

/**
 * Reducer for errors state. Changed by `ERROR`
 * and `CLEAR_ERRORS` actions.
 * @param  {Object} [state=[]] - Current authError redux state
 * @param  {Object} action - Object containing the action that was dispatched
 * @param  {String} action.type - Type of action that was dispatched
 * @return {Object} Profile state after reduction
 */
const errorsAllIds = (state = [], { meta, type }) => {
  if (!meta || !meta.id) {
    return state;
  }
  switch (type) {
    case LOGIN_ERROR:
    case ERROR:
      return [...state, meta.id];
    case CLEAR_ERRORS:
      return [];
    case CLEAR_ERROR:
      return state.filter(lId => lId !== meta.id);
    default:
      return state;
  }
};

/**
 * Reducer for errors state. Changed by `ERROR`
 * and `CLEAR_ERRORS` actions.
 * @param  {Object} [state=[]] - Current authError redux state
 * @param  {Object} action - Object containing the action that was dispatched
 * @param  {String} action.type - Type of action that was dispatched
 * @return {Object} Profile state after reduction
 */
const errorsByQuery = (state = {}, { meta, payload, type }) => {
  if (!meta || !meta.id) {
    return state;
  }
  switch (type) {
    case LOGIN_ERROR:
    case ERROR:
      return {
        ...state,
        [meta.id]: payload,
      };
    case LISTENER_ERROR:
      return {
        ...state,
        [pathFromMeta(meta)]: payload,
      };
    case CLEAR_ERRORS:
      return [];
    case CLEAR_ERROR:
      return state.filter(lId => lId !== payload.id);
    default:
      return state;
  }
};

const errorsReducer = combineReducers({
  byQuery: errorsByQuery,
  allIds: errorsAllIds,
});

export default errorsReducer;
