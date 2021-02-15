import { get } from 'lodash';
import { setWith } from 'lodash/fp';
import { actionTypes } from '../constants';
import { pathFromMeta, preserveValuesFromState } from '../utils/reducers';

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
 * @param {object} [state={}] - Current data redux state
 * @param {object} action - Object containing the action that was dispatched
 * @param {string} action.type - Type of action that was dispatched
 * @param {object} action.meta - Meta data of action
 * @param {string} action.meta.collection - Name of the collection for the
 * data being passed to the reducer.
 * @param {Array} action.meta.where - Where query parameters array
 * @param {Array} action.meta.storeAs - Another parameter in redux under
 * which to store values.
 * @returns {object} Data state after reduction
 */
export default function dataReducer(state = {}, action) {
  switch (action.type) {
    case GET_SUCCESS:
    case LISTENER_RESPONSE:
      const { meta, payload } = action;
      // Return state if payload are invalid
      if (!payload || payload.data === undefined) {
        return state;
      }
      // Get doc from subcollections if they exist
      const getDocName = data =>
        data.subcollections
          ? getDocName(data.subcollections.slice(-1)[0]) // doc from last item of subcollections array
          : data.doc; // doc from top level meta
      const docName = getDocName(meta);
      // Data to set to state is doc if doc name exists within meta
      const data = docName ? get(payload.data, docName) : payload.data;
      // Get previous data at path to check for existence
      const previousData = get(
        state,
        meta.storeAs ? [meta.storeAs] : pathFromMeta(meta),
      );
      // Set data (without merging) if no previous data exists or if there are subcollections
      if (!previousData || meta.subcollections) {
        // Set data to state immutabily (lodash/fp's setWith creates copy)
        return setWith(
          Object,
          meta.storeAs ? [meta.storeAs] : pathFromMeta(meta),
          data,
          state,
        );
      }
      // Set data to state (with merge) immutabily (lodash/fp's setWith creates copy)
      return setWith(
        Object,
        meta.storeAs ? [meta.storeAs] : pathFromMeta(meta),
        data,
        state,
      );
    case DOCUMENT_MODIFIED:
    case DOCUMENT_ADDED:
      return setWith(
        Object,
        pathFromMeta(action.meta),
        action.payload.data,
        state,
      );
    case DOCUMENT_REMOVED:
    case DELETE_SUCCESS:
      const removePath = pathFromMeta(action.meta);
      const cleanedState = setWith(Object, removePath, null, state);
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
      const nextState = setWith(Object, pathFromMeta(action.meta), null, state);
      if (action.preserve && action.preserve.data) {
        return preserveValuesFromState(state, action.preserve.data, nextState);
      }
      const existingState = get(state, pathFromMeta(action.meta));
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
