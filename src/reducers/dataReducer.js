import { pick, get } from 'lodash';
import { setWith, assign } from 'lodash/fp';
import { actionTypes } from '../constants';
import { pathFromMeta } from '../utils/reducers';

const { CLEAR_DATA, GET_SUCCESS, LISTENER_RESPONSE } = actionTypes;

/**
 * @name dataReducer
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
export default function dataReducer(state = {}, action) {
  switch (action.type) {
    case GET_SUCCESS:
    case LISTENER_RESPONSE:
      const { meta, payload, preserve } = action;
      // Return state if payload are invalid
      if (!payload || payload.data === undefined) {
        return state;
      }
      // Get doc from subcollections if they exist
      const docName = meta.subcollections
        ? meta.subcollections.slice(-1)[0].doc // doc from last item of subcollections array
        : meta.doc; // doc from top level meta
      // Data to set to state is doc if doc name exists within meta
      const data = docName ? get(payload.data, docName) : payload.data;
      // Get previous data at path to check for existence
      const previousData = get(state, pathFromMeta(meta));
      // Only merge if data does not already exist or if meta contains subcollections
      if (!previousData || meta.subcollections) {
        // Set data to state immutabily (lodash/fp's setWith creates copy)
        return setWith(Object, pathFromMeta(meta), data, state);
      }
      // Otherwise merge with existing data
      const mergedData = assign(previousData, data);
      // Set data to state (with merge) immutabily (lodash/fp's setWith creates copy)
      return setWith(Object, pathFromMeta(meta), mergedData, state);
    case CLEAR_DATA:
      // support keeping data when logging out - #125 of react-redux-firebase
      if (preserve) {
        return pick(state, preserve); // pick returns a new object
      }
      return {};
    default:
      return state;
  }
}
