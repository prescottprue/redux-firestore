import { actionTypes } from '../constants';
import { getQueryName } from '../utils/query';
import { combineReducers } from '../utils/reducers';

const { CLEAR_ERRORS, CLEAR_ERROR, LISTENER_ERROR, ERROR } = actionTypes;

/**
 * Reducer for errors state. Changed by `ERROR`
 * and `CLEAR_ERRORS` actions.
 * @param {object} [state=[]] - Current authError redux state
 * @param {object} action - Object containing the action that was dispatched
 * @param {string} action.type - Type of action that was dispatched
 * @param {object} action.meta - Metadata of action
 * @returns {object} Profile state after reduction
 */
function errorsAllIds(state = [], { meta, type }) {
  switch (type) {
    case LISTENER_ERROR:
    case ERROR:
      if (state.indexOf(getQueryName(meta)) !== -1) {
        return state;
      }
      return [...state, getQueryName(meta)];
    case CLEAR_ERRORS:
      return [];
    case CLEAR_ERROR:
      return state.filter((lId) => lId !== getQueryName(meta));
    default:
      return state;
  }
}

/**
 * Reducer for errors state. Changed by `ERROR`
 * and `CLEAR_ERRORS` actions.
 * @param {object} [state=[]] - Current authError redux state
 * @param {object} action - Object containing the action that was dispatched
 * @param {string} action.type - Type of action that was dispatched
 * @param {object} action.meta - Metadata of action
 * @param {object} action.payload - Payload of action
 * @returns {object} Profile state after reduction
 */
function errorsByQuery(state = {}, { meta, payload, type }) {
  switch (type) {
    case ERROR:
    case LISTENER_ERROR:
      return {
        ...state,
        [getQueryName(meta)]: payload,
      };
    case CLEAR_ERROR:
      return {
        ...state,
        [getQueryName(meta)]: null,
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
