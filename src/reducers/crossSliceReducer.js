/* eslint-disable guard-for-in, no-restricted-syntax, no-param-reassign */
import produce from 'immer';
import { groupBy, merge, set, get } from 'lodash';
import { actionTypes } from '../constants';
import { preserveValuesFromState } from '../utils/reducers';

/**
 * Reducer for crossSlice state
 * @param  {object} [state={}] - Current ordered redux state
 * @param  {object} action - The action that was dispatched
 * @param  {string} action.type - Type of action that was dispatched
 * @returns {object} Cross slice state
 */
export default function crossSliceReducer(state = {}, action) {
  return produce(state, (draft) => {
    switch (action.type) {
      case actionTypes.DOCUMENT_MODIFIED:
      case actionTypes.DOCUMENT_ADDED:
      case actionTypes.DOCUMENT_REMOVED:
      case actionTypes.LISTENER_RESPONSE:
      case actionTypes.UNSET_LISTENER:
        // Take all of the query values and plop them into composite, replacing the existing data entirely
        const groups = groupBy(
          (!!state.queries && Object.values(state.queries)) || [],
          (c) => c.storeAs || c.collection,
        );

        Object.keys(groups).forEach((storeAs) => {
          const updated = {};
          groups[storeAs].forEach((item) =>
            merge(updated, get(item, 'data', {})),
          );

          set(draft, ['composite', storeAs], updated);
        });

        return draft;
      case actionTypes.CLEAR_DATA:
        // support keeping data when logging out - #125
        if (action.preserve && action.preserve.ordered) {
          return preserveValuesFromState(state, action.preserve.ordered, {});
        }
        return {};
      default:
        return state;
    }
  });
}
