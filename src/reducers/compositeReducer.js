import { actionTypes } from '../constants';
import { getQueryName } from '../utils/query';

export const isComposable = action =>
  action.meta.where && action.meta.collection;

export default function compositeReducer(state = {}, action) {
  switch (action.type) {
    case actionTypes.LISTENER_RESPONSE:
      // Only relevant for queries
      if (!isComposable(action)) {
        return state;
      }

      const key = getQueryName(action.meta); // get a unique key for the query
      return {
        ...state,
        [key]: { data: action.payload.data, ...action.meta },
      };
    default:
      return state;
  }
}
