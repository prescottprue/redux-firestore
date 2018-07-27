/* eslint-disable no-param-reassign */

import produce from 'immer';
import { set, get } from 'lodash';
import { actionTypes } from '../constants';
import { getBaseQueryName } from '../utils/query';

export const isComposable = action =>
  get(action, 'meta.where') && get(action, 'meta.collection');

export default function compositeReducer(state = {}, action) {
  return produce(state, draft => {
    if (!isComposable(action)) {
      return state;
    }

    const key = getBaseQueryName(action.meta); // get a unique key for the query

    switch (action.type) {
      case actionTypes.GET_SUCCESS:
      case actionTypes.LISTENER_RESPONSE:
        draft[key] = { data: action.payload.data, ...action.meta };
        return draft;
      case actionTypes.DOCUMENT_ADDED:
      case actionTypes.DOCUMENT_MODIFIED:
        set(draft, [key, 'data', action.meta.doc], action.payload.data);
        return draft;
      case actionTypes.DOCUMENT_REMOVED:
      case actionTypes.DELETE_SUCCESS:
        delete draft[key].data[action.meta.doc];
        return draft;
      default:
        return state;
    }
  });
}
