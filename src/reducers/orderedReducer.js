import { size, get, unionBy, reject } from 'lodash';
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

/**
 * Case reducer for adding a document to a collection.
 * @param  {Array} [collectionState=[]] - Redux state of current collection
 * @param  {Object} action - The action that was dispatched
 * @return {Array} State with document modified
 */
function addDoc(array = [], action) {
  return [
    ...array.slice(0, action.payload.ordered.newIndex),
    { id: action.meta.doc, ...action.payload.data },
    ...array.slice(action.payload.ordered.newIndex),
  ];
}

/**
 * Case reducer for modifying a document within a collection.
 * @param  {Array} collectionState - Redux state of current collection
 * @param  {Object} action - The action that was dispatched
 * @return {Array} State with document modified
 */
function modifyDoc(collectionState, action) {
  return updateItemInArray(collectionState, action.meta.doc, item =>
    // Merge is used to prevent the removal of existing subcollections
    mergeObjects(item, action.payload.data),
  );
}

/**
 * Case reducer for adding a document to a collection.
 * @param  {Array} collectionState - Redux state of current collection
 * @param  {Object} action - The action that was dispatched
 * @return {Array} State with document modified
 */
function removeDoc(array, action) {
  return reject(array, { id: action.meta.doc }); // returns a new array
}

/**
 * Case reducer for writing/updating a whole collection.
 * @param  {Array} collectionState - Redux state of current collection
 * @param  {Object} action - The action that was dispatched
 * @return {Array} State with document modified
 */
function writeCollection(collectionState, action) {
  const { meta, merge = { doc: true, collection: true } } = action;
  // Handle doc update (update item in array instead of whole array)
  if (meta.doc && merge.doc && size(collectionState)) {
    // Merge if data already exists
    // Merge with existing ordered array if collection merge enabled
    return modifyDoc(collectionState, action);
  }
  // Merge with existing ordered array if collection merge enabled
  if (merge.collection && size(collectionState)) {
    return unionBy(collectionState, action.payload.ordered, 'id');
  }

  // Handle subcollections
  if (meta.doc && meta.subcollections) {
    if (!size(collectionState)) {
      // Collection state does not already exist, create it with item containing
      // subcollection
      return [
        {
          id: meta.doc,
          [meta.subcollections[0].collection]: action.payload.ordered,
        },
      ];
    }
    // Merge with existing document if collection state exists
    return updateItemInArray(collectionState, meta.doc, item =>
      mergeObjects(item, {
        [meta.subcollections[0].collection]: action.payload.ordered,
      }),
    );
  }
  if (meta.doc && size(collectionState)) {
    return updateItemInArray(collectionState, meta.doc, item =>
      mergeObjects(item, action.payload.ordered[0]),
    );
  }
  return action.payload.ordered;
}

/**
 * Reducer for an ordered collection (stored under path within ordered reducer)
 * which is a map of handlers which are called for different action types.
 * @type {Function}
 */
const orderedCollectionReducer = createReducer(undefined, {
  [DOCUMENT_ADDED]: addDoc,
  [DOCUMENT_MODIFIED]: modifyDoc,
  [DOCUMENT_REMOVED]: removeDoc,
  [LISTENER_RESPONSE]: writeCollection,
  [GET_SUCCESS]: writeCollection,
});

/**
 * Reducer for ordered state.
 * @param  {Object} [state={}] - Current ordered redux state
 * @param  {Object} action - The action that was dispatched
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
  if (action.type === CLEAR_DATA) {
    // support keeping data when logging out - #125
    if (action.preserve && action.preserve.ordered) {
      return preserveValuesFromState(state, action.preserve.ordered, {});
    }
    return {};
  }
  const storeUnderKey = action.meta.storeAs || action.meta.collection;
  const collectionStateSlice = get(state, storeUnderKey);
  return {
    ...state,
    [storeUnderKey]: orderedCollectionReducer(collectionStateSlice, action),
  };
}
