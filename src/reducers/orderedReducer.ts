import { ActionMeta } from './../types'
import {
  size,
  get,
  reject,
  dropRight,
  map,
  keyBy,
  isEqual,
  last,
} from 'lodash';
import { assign as assignObjects, merge as mergeObjects } from 'lodash/fp';
import { actionTypes } from '../constants';
import { getQueryName } from '../utils/query';
import {
  updateItemInArray,
  createReducer,
  preserveValuesFromState,
  pathToArr,
} from '../utils/reducers';
import { OrderedState, ReduxFirestoreAction, OrderedActionPayload } from '../types';

const {
  DOCUMENT_ADDED,
  GET_SUCCESS,
  LISTENER_RESPONSE,
  CLEAR_DATA,
  DELETE_SUCCESS,
  DOCUMENT_REMOVED,
  DOCUMENT_MODIFIED,
} = actionTypes;

/**
 * Create a new copy of an array with the provided item in a new array index
 * @param [collectionState=[]] - Redux state of current collection
 * @param meta - New array metadata
 * @param meta.oldIndex - New array index for the item
 * @param meta.newIndex -
 * @param newValue - New value of the item
 * @returns
 */
function newArrayWithItemMoved(collectionState: any[], meta: any = {}, newValue: any) {
  const { oldIndex, newIndex } = meta;
  // remove oldIndex from array while creating a copy
  const arrayWithoutItem = [
    ...collectionState.slice(0, oldIndex),
    ...collectionState.slice(oldIndex + 1),
  ];
  // Insert item in new array while preserving order of other items
  return [
    ...arrayWithoutItem.slice(0, newIndex),
    // set new item (falling back to using a copy of the removed item)
    newValue || { ...collectionState[oldIndex] },
    ...arrayWithoutItem.slice(newIndex),
  ];
}

/**
 * Case reducer for modifying a document within a collection or
 * subcollection. When storeAs is being used, subcollections are
 * moved to the level of the storeAs (instead of on their parent doc).
 * @param [collectionState=[]] - Redux state of current collection
 * @param action - The action that was dispatched
 * @returns State with document modified
 */
function modifyDoc(collectionState: any[] | undefined, action: ReduxFirestoreAction): any[] {
  // Support moving a doc within an array
  if (action.payload.ordered && !!(action.payload.ordered as any).newIndex) {
    const { newIndex, oldIndex } = (action.payload.ordered as any);
    // newIndex value exists, item was within array before, and the index has changed
    if (collectionState && !!newIndex && oldIndex > -1 && newIndex !== oldIndex) {
      return newArrayWithItemMoved(
        collectionState,
        action.payload.ordered,
        action.payload.data,
      );
    }
  }
  
  if (!action.meta.subcollections || action.meta.storeAs) {
    return updateItemInArray(collectionState, action.meta.doc, item =>
      // Merge is used to prevent the removal of existing subcollections
      assignObjects(item, action.payload.data),
    );
  }

  // TODO: make this recurisve so it will work multiple subcollections deep
  const [, docId, subcollectionName, subDocId] = pathToArr(action.meta.path);

  // Update document item within top array
  return updateItemInArray(collectionState, docId, item => ({
    ...item, // preserve document (only updating subcollection)
    [subcollectionName]: updateItemInArray(
      get(item, subcollectionName, []),
      subDocId,
      // Merge with existing subcollection doc (only updates changed keys)
      subitem => mergeObjects(subitem, action.payload.data),
    ),
  }));
}

function lastDocKey(meta: any): string {
  return meta.subcollections ? meta.subcollections.slice(-1)[0].doc : meta.doc;
}

/**
 * Case reducer for adding a document to a collection or subcollection.
 * @param [array=[]] - Redux state of current collection
 * @param action - The action that was dispatched
 * @returns State with document modified
 */
function addDoc(array: any[] | undefined = [], action: ReduxFirestoreAction): any[] {
  const { meta, payload } = action;
  if (!payload.ordered || Array.isArray(payload.ordered)) {
    return array.concat([{ id: lastDocKey(meta), ...payload.data }])
  }
  return [
    ...array.slice(0, payload.ordered.newIndex),
    { id: lastDocKey(meta), ...payload.data },
    ...array.slice(payload.ordered.newIndex),
  ];
}

/**
 * Case reducer for adding a document to a collection.
 * @param array - Redux state of current collection
 * @param action - The action that was dispatched
 * @returns State with document modified
 */
function removeDoc(array: any[], action: ReduxFirestoreAction): any[] {
  // Remove doc from collection array
  return reject(array, { id: lastDocKey(action.meta) }); // returns a new array
}

/**
 * Case reducer for writing/updating a whole collection.
 * @param collectionState - Redux state of current collection
 * @param action - The action that was dispatched
 * @returns State with document modified
 */
function writeCollection(collectionState: any[] | undefined, action: ReduxFirestoreAction): OrderedActionPayload | any[] | undefined {
  const { meta, merge = { doc: true, collections: true } } = action;
  if (meta.storeAs) {
    return action.payload.ordered;
  }
  const collectionStateSize = size(collectionState);
  const payloadExists = !!size(action.payload.ordered);

  // Handle doc update (update item in array instead of whole array)
  if (meta.doc && merge.doc && collectionStateSize) {
    // Merge if data already exists
    // Merge with existing ordered array if collection merge enabled
    return modifyDoc(collectionState, action);
  }

  // Merge with existing ordered array (existing as source) if collection merge enabled
  if (collectionStateSize && merge.collections) {
    // Listener response is empty - empty state
    if (!payloadExists) {
      return [];
    }
    // Key existing state collection by id (used to prevent multiple array lookups)
    const existingKeys = collectionState && keyBy(collectionState, 'id');
    // Map new doc data with existing doc data (preserves existing sub-collections)
    return map(action.payload.ordered, (newDocObj: any) => {
      const existingDoc = get(existingKeys, newDocObj.id);
      // merge with existing doc if existing doc is not equal
      return !!existingDoc && !isEqual(existingDoc, newDocObj)
        ? { ...existingDoc, ...newDocObj }
        : newDocObj;
    });
  }

  if (meta.doc && collectionStateSize) {
    // don't update ordered if the doc doesn't exist
    if (!size(action.payload.ordered)) {
      return collectionState;
    }
    // Update item in array
    return updateItemInArray(collectionState, meta.doc, item =>
      mergeObjects(item, (action.payload.ordered as any)[0]),
    );
  }

  return action.payload.ordered;
}

const actionHandlers = {
  [DOCUMENT_ADDED]: addDoc,
  [DOCUMENT_MODIFIED]: modifyDoc,
  [DOCUMENT_REMOVED]: removeDoc,
  [DELETE_SUCCESS]: removeDoc,
  [LISTENER_RESPONSE]: writeCollection,
  [GET_SUCCESS]: writeCollection,
};

/**
 * Reducer for an ordered collection (stored under path within ordered reducer)
 * which is a map of handlers which are called for different action types.
 */
const orderedCollectionReducer = createReducer(undefined, actionHandlers);

/**
 * Remove the last doc setting from action metadata
 * @param meta.subcollections - Subcollections which the action
 * associates with
 * @param meta.doc - Name of Document which the action
 * associates with
 */
function removeLastDocFromMeta(meta: any): any {
  if (!meta.subcollections) {
    return { ...meta, doc: undefined };
  }
  const lastSubcollection = last(meta.subcollections);
  const modifiedSubcollections = [
    ...dropRight(meta.subcollections),
    { ...lastSubcollection, doc: undefined },
  ];
  return { ...meta, subcollections: modifiedSubcollections };
}

/**
 * Get key where ordered collection data is stored within state based
 * on query config.
 * @param action - The action that was dispatched
 */
function getStoreUnderKey(action: any) {
  if (action.meta.oldStoreAs) {
    return action.meta.storeAs || action.meta.collection;
  }
  const queryName = getQueryName(action.meta);

  // Query contains other query params, store under full queryName
  if (queryName.includes('?')) {
    // Remove last doc from query (so that path is of parent collection)
    return getQueryName(removeLastDocFromMeta(action.meta));
  }
  const pathArr = pathToArr(queryName);
  // Return top level key if path is not multiple "/"
  if (pathArr.length <= 1) {
    return action.meta.storeAs || action.meta.collection;
  }

  // Remove last / from path
  return dropRight(pathArr).join('/');
}

/**
 * Reducer for ordered state.
 * @param [state={}] - Current ordered redux state
 * @param action - The action that was dispatched
 * @param action.type - Type of action that was dispatched
 * @param action.meta.collection - Name of Collection which the action
 * associates with
 * @param action.meta.doc - Name of Document which the action
 * associates with
 * @param action.meta.subcollections - Subcollections which the action
 * associates with
 * @param action.meta.storeAs - Another key within redux store that the
 * action associates with (used for storing data under a path different
 * from its collection/document)
 * @param action.payload - Object containing data associated with
 * action
 * @param action.payload.ordered - Ordered Array Data associated with
 * action
 * @return Ordered state after reduction
 */
export default function orderedReducer(state: OrderedState = {}, action: ReduxFirestoreAction): OrderedState {
  // Return state if action is malformed (i.e. no type)
  if (!action.type) {
    return state;
  }

  // Clear state based on config for CLEAR_DATA action type
  if (action.type === CLEAR_DATA) {
    // support keeping data when logging out - #125
    if (action.preserve && action.preserve.ordered) {
      return preserveValuesFromState(state, action.preserve.ordered, {});
    }
    return {};
  }

  // Return original state if action type is not within actionHandlers
  if (!Object.prototype.hasOwnProperty.call(actionHandlers, action.type)) {
    return state;
  }

  const storeUnderKey = action.meta.storeAs || action.meta.collection;
  // Return state if action does not contain valid meta
  if (!action.meta || !storeUnderKey) {
    return state;
  }

  const collectionStateSlice = get(state, storeUnderKey);
  return {
    ...state,
    [storeUnderKey]: orderedCollectionReducer(collectionStateSlice, action),
  };
}
