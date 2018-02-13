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
      const previousData = get(state, pathFromMeta(meta));
      // Set data (without merging) if no previous data exists or if there are subcollections
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
      if (action.preserve) {
        return pick(state, action.preserve); // pick returns a new object
      }
      return {};
    // TODO: LISTENER_ERROR that sets null in a way that is configurable (v0.3.0)
    default:
      return state;
  }
}
