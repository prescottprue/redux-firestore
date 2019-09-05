import { get, last, dropRight } from 'lodash';
import { setWith, assign } from 'lodash/fp';
import { actionTypes } from '../constants';
import { getQueryName } from '../utils/query';
import { preserveValuesFromState, pathToArr } from '../utils/reducers';
import { DataState, ReduxFirestoreAction } from '../types';

const {
  CLEAR_DATA,
  GET_SUCCESS,
  LISTENER_RESPONSE,
  LISTENER_ERROR,
  DELETE_SUCCESS,
  DOCUMENT_ADDED,
  DOCUMENT_MODIFIED,
  DOCUMENT_REMOVED,
} = actionTypes;

/**
 * Reducer for data state.
 * @param  {Object} [state={}] - Current data redux state
 * @param  {Object} action - Object containing the action that was dispatched
 * @param  {String} action.type - Type of action that was dispatched
 * @param  {Object} action.meta - Meta data of action
 * @param  {String} action.meta.collection - Name of the collection for the
 * data being passed to the reducer.
 * @param  {Array} action.meta.where - Where query parameters array
 * @param  {Array} action.meta.storeAs - Another parameter in redux under
 * which to store values.
 * @return {Object} Data state after reduction
 */
export default function dataReducer(state: DataState = {}, action: ReduxFirestoreAction): DataState {
  switch (action.type) {
    case GET_SUCCESS:
    case LISTENER_RESPONSE:
      const { meta, payload } = action;
      // Return state if payload are invalid
      if (!payload || payload.data === undefined) {
        return state;
      }
      const queryName = getQueryName(meta, { onlySubcollections: true });
      // Get previous data at path to check for existence
      const previousData = get(state, meta.storeAs || queryName);
      if (meta.subcollections) {
        const setPath =
          queryName.split('/').length % 2
            ? getQueryName(meta)
            : dropRight(pathToArr(queryName)).join('/');
        // Set data to state immutabily (lodash/fp's setWith creates copy)
        return setWith(Object, setPath, payload.data, state);
      }
      // Set data (without merging) if no previous data exists or if there are subcollections
      if (!previousData || meta.subcollections) {
        // Set data to state immutabily (lodash/fp's setWith creates copy)
        return setWith(Object, meta.storeAs || queryName, payload.data, state);
      }
      // Otherwise merge with existing data
      const mergedData = assign(previousData, payload.data);
      // Set data to state (with merge) immutabily (lodash/fp's setWith creates copy)
      return setWith(Object, meta.storeAs || queryName, mergedData, state);
    case DOCUMENT_MODIFIED:
    case DOCUMENT_ADDED:
      return setWith(
        Object,
        getQueryName(action.meta, { onlySubcollections: true }),
        action.payload.data,
        state,
      );
    case DOCUMENT_REMOVED:
    case DELETE_SUCCESS:
      const removePath = getQueryName(action.meta, {
        onlySubcollections: true,
      });
      const id = last(pathToArr(getQueryName(action.meta)));
      const cleanedState = setWith(Object, `${removePath}.${id}`, null, state);
      if (action.preserve && action.preserve.data) {
        return preserveValuesFromState(
          state,
          action.preserve.data,
          cleanedState,
        );
      }
      return cleanedState;
    case CLEAR_DATA:
      // support keeping data when logging out - #125 of react-redux-firebase
      if (action.preserve && action.preserve.data) {
        return preserveValuesFromState(state, action.preserve.data, {});
      }
      return {};
    case LISTENER_ERROR:
      // Set data to state immutabily (lodash/fp's setWith creates copy)
      const nextState = setWith(
        Object,
        getQueryName(action.meta, { onlySubcollections: true }),
        null,
        state,
      );
      if (action.preserve && action.preserve.data) {
        return preserveValuesFromState(state, action.preserve.data, nextState);
      }
      const existingState = get(
        state,
        getQueryName(action.meta, { onlySubcollections: true }),
      );
      // If path contains data already, leave it as it is (other listeners
      // could have placed it there)
      if (existingState) {
        return state;
      }
      return nextState;
    default:
      return state;
  }
}
