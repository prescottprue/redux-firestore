/* eslint-disable guard-for-in, no-restricted-syntax, no-param-reassign */

import produce from 'immer';
import { values, groupBy, merge, set, get } from 'lodash';
import { actionTypes } from '../constants';

export default function crossSliceReducer(state = {}, action) {
  return produce(state, draft => {
    switch (action.type) {
      case actionTypes.DOCUMENT_MODIFIED:
      case actionTypes.DOCUMENT_ADDED:
      case actionTypes.DOCUMENT_REMOVED:
      case actionTypes.LISTENER_RESPONSE:
      case actionTypes.UNSET_LISTENER:
        // Take all of the query values and plop them into composite, replacing the existing data entirely
        const groups = groupBy(
          values(state.queries),
          c => c.storeAs || c.collection,
        );

        for (const storeAs in groups) {
          const updated = {};
          for (const item of groups[storeAs]) {
            merge(updated, get(item, 'data', {}));
          }
          set(draft, ['composite', storeAs], updated);
        }

        return draft;
      default:
        return state;
    }
  });
}
