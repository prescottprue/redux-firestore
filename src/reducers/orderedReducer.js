import { size, get, unionBy } from 'lodash';
import { merge as mergeObjects } from 'lodash/fp';
import { actionTypes } from '../constants';
import {
  updateItemInArray,
  createReducer,
  preserveValuesFromState,
} from '../utils/reducers';

const {
  DOCUMENT_ADDED,
  GET_SUCCESS,
  LISTENER_RESPONSE,
  CLEAR_DATA,
  DOCUMENT_REMOVED,
  DOCUMENT_MODIFIED,
} = actionTypes;

function addDoc(array, action) {
  return [
    ...array.slice(0, action.payload.ordered.newIndex),
    { id: action.meta.doc, ...action.payload.data },
    ...array.slice(action.payload.ordered.newIndex),
  ];
}

// Case reducer
function modifyDoc(collectionState, action) {
  return updateItemInArray(collectionState, action.meta.doc, item =>
    Object.assign({}, item, action.payload.data),
  );
}

function mergeDoc(collectionState, action) {
  return updateItemInArray(collectionState, action.meta.doc, item =>
    mergeObjects(item, action.payload.data),
  );
}

function removeDoc(collectionState, action) {
  return updateItemInArray(collectionState, action.meta.doc, () => null);
}

function writeCollection(collectionState, action) {
  const { meta, merge = { doc: true, collection: true } } = action;
  // Handle doc update (update item in array instead of whole array)
  if (meta.doc && merge.doc && size(collectionState)) {
    // Merge if data already exists
    // Merge with existing ordered array if collection merge enabled
    return mergeDoc(collectionState, action);
  }
  // Merge with existing ordered array if collection merge enabled
  if (merge.collection && size(collectionState)) {
    return unionBy(collectionState, action.payload.ordered, 'id');
  }
  return action.payload.ordered;
}

function clearCollection(collectionState, action) {
  // support keeping data when logging out - #125
  if (action.preserve && action.preserve.ordered) {
    return preserveValuesFromState(
      collectionState,
      action.preserve.ordered,
      {},
    );
  }
  return null;
}

const orderedCollectionReducer = createReducer(undefined, {
  [DOCUMENT_ADDED]: addDoc,
  [DOCUMENT_MODIFIED]: modifyDoc,
  [DOCUMENT_REMOVED]: removeDoc,
  [LISTENER_RESPONSE]: writeCollection,
  [GET_SUCCESS]: writeCollection,
  [CLEAR_DATA]: clearCollection,
});

/**
 * Reducer for ordered state.
 * @param  {Object} [state={}] - Current ordered redux state
 * @param  {Object} action - Object containing the action that was dispatched
 * @param  {String} action.type - Type of action that was dispatched
 * @param  {String} action.meta.collection - Name of Collection which the action
 * associates with
 * @param  {String} action.meta.doc - Name of Document which the action
 * associates with
 * @param  {Array} action.meta.subcollections - Subcollections which the action
 * associates with
 * @param  {String} action.meta.storeAs - Another key within redux store that the
 * action associates with (used for storing data under a path different
 * from its collection/document)
 * @param  {Object} action.payload - Object containing data associated with
 * action
 * @param  {Array} action.payload.ordered - Ordered Array Data associated with
 * action
 * @return {Object} Ordered state after reduction
 */
export default function orderedReducer(state = {}, action) {
  if (!action.meta || (!action.meta.storeAs && !action.meta.collection)) {
    return state;
  }
  const storeUnderKey = action.meta.storeAs || action.meta.collection;
  const collectionStateSlice = get(state, storeUnderKey);
  return {
    ...state,
    [storeUnderKey]: orderedCollectionReducer(collectionStateSlice, action),
  };
}
