import { combineReducers, AnyAction } from 'redux';
import { actionTypes } from '../constants';
import { getQueryName } from '../utils/query';
import { ReduxFirestoreAction } from '../types';

const { CLEAR_ERRORS, CLEAR_ERROR, LISTENER_ERROR, ERROR } = actionTypes;

type AllErrorIdsState = string[]

export interface ErrorsByQueryState {
  [k: string]: any
}

export interface ErrorsState {
  byQuery: ErrorsByQueryState
  allIds: AllErrorIdsState
}

/**
 * Reducer for errors state. Changed by `ERROR`
 * and `CLEAR_ERRORS` actions.
 * @param [state=[]] - Current authError redux state
 * @param action - Object containing the action that was dispatched
 * @param action.type - Type of action that was dispatched
 * @returns Profile state after reduction
 */
function errorsAllIds(state: any, action: ReduxFirestoreAction): AllErrorIdsState {
  const { meta, type } = action
  switch (type) {
    case LISTENER_ERROR:
    case ERROR:
      const queryName = getQueryName(meta)
      if (state.includes(queryName)) {
        return state;
      }
      return [...state, getQueryName(meta)];
    case CLEAR_ERRORS:
      return [];
    case CLEAR_ERROR:
      return state.filter((lId: string) => lId !== getQueryName(meta));
    default:
      return state;
  }
}

/**
 * Reducer for errors state. Changed by `ERROR` and `CLEAR_ERRORS` actions.
 * @param [state=[]] - Current authError redux state
 * @param action - Object containing the action that was dispatched
 * @param action.type - Type of action that was dispatched
 * @returns Profile state after reduction
 */
function errorsByQuery(state: ErrorsByQueryState = {}, action: ReduxFirestoreAction): ErrorsByQueryState {
  const { meta, payload, type } = action
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
