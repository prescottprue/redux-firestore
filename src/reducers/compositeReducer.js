import { actionTypes } from '../constants';
import { getQueryName } from '../utils/query';

export default function compositeReducer(state = {}, action) {
  switch (action.type) {
    case actionTypes.LISTENER_RESPONSE:
      // Only relevant for queries
      if (!action.meta.where || !action.meta.storeAs) {
        return state;
      }

      const key = getQueryName(action.meta); // get a unique key for the query
      return {
        ...state,
        [key]: { data: action.payload.data, storeAs: action.meta.storeAs },
      };
    default:
      return state;
  }
}
