/* eslint-disable no-param-reassign */
import produce from 'immer';
import { set, unset } from 'lodash';
import { actionTypes } from '../constants';
import { getBaseQueryName } from '../utils/query';
import { ReduxFirestoreAction } from '../types';

export function isComposable(action: ReduxFirestoreAction) {
  return action && action.meta && action.meta.where && action.meta.collection;
}
  
export interface QueriesState {
  [k: string]: any
}

/**
 *
 * @param [state={}] - Current listenersById redux state
 * @param action - Object containing the action that was dispatched
 * @param action.type - Type of action that was dispatched
 * @returns Queries state
 */
export default function queriesReducer(state = {}, action: ReduxFirestoreAction): QueriesState {
  return produce(state, (draft: any) => {
    if (!isComposable(action)) {
      return state;
    }

    const key = getBaseQueryName(action.meta); // get a unique key for the query

    switch (action.type) {
      case actionTypes.GET_SUCCESS:
      case actionTypes.LISTENER_RESPONSE:
        draft[key] = { data: action.payload && action.payload.data, ...action.meta };
        return draft;
      case actionTypes.UNSET_LISTENER:
        // Deleting this key complicates recomposing the result -
        // since it is no longer defined, it will not be overwritten.
        // Emptying out the data is a pragmatic compromise.
        if (draft[key]) {
          draft[key].data = undefined;
        }

        return draft;
      case actionTypes.DOCUMENT_ADDED:
      case actionTypes.DOCUMENT_MODIFIED:
        set(draft, ([key, 'data', action.meta.doc]) as any, action.payload && action.payload.data);
        return draft;
      case actionTypes.DOCUMENT_REMOVED:
      case actionTypes.DELETE_SUCCESS:
        unset(draft, ([key, 'data', action.meta.doc] as any));
        return draft;
      default:
        return state;
    }
  });
}
