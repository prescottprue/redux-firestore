/* eslint-disable guard-for-in, no-restricted-syntax */

import { values, groupBy, merge, cloneDeep } from 'lodash';
import { actionTypes } from '../constants';

export default function crossSliceReducer(state = {}, action) {
  switch (action.type) {
    case actionTypes.LISTENER_RESPONSE:
      // Only relevant for queries
      if (!action.meta.where || !action.meta.storeAs) {
        return state;
      }

      // Take all of the composite values and plop them into data, replacing the existing data entirely
      const newState = cloneDeep(state);
      const groups = groupBy(values(state.composite), c => c.storeAs);

      for (const storeAs in groups) {
        const updated = {};
        for (const item of groups[storeAs]) {
          merge(updated, item.data);
        }
        newState.data[storeAs] = updated;
      }

      return newState;
    default:
      return state;
  }
}
