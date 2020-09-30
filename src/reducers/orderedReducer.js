import { size, get, unionBy, reject, omit, map, keyBy, isEqual } from 'lodash';
import { merge as mergeObjects } from 'lodash/fp';
import { actionTypes } from '../constants';
import {
  updateItemInArray,
  createReducer,
  preserveValuesFromState,
  pathToArr,
} from '../utils/reducers';

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
 *
 * @param {Array} [collectionState=[]] - Redux state of current collection
 * @param {object} meta - Redux Action meta data contains the doc id
 * @param {object} ordered - New array metadata
 * @param {object} ordered.oldIndex - New array index for the item
 * @param {object} ordered.newIndex -
 * @param {object} newValue - New value of the item
 * @returns {Array} Array with item moved
 */
function newArrayWithItemMoved(collectionState, meta, ordered, newValue) {
  const { doc } = meta;
  const { oldIndex, newIndex } = ordered || {};
  // remove oldIndex from array while creating a copy
  const arrayWithoutItem = [
    ...collectionState.slice(0, oldIndex),
    ...collectionState.slice(oldIndex + 1),
  ];
  // Insert item in new array while preserving order of other items
  return [
    ...arrayWithoutItem.slice(0, newIndex),
    // set new item (falling back to using a copy of the removed item)
    { id: doc, ...newValue } || { ...collectionState[oldIndex] },
    ...arrayWithoutItem.slice(newIndex),
  ];
}

/**
 * Case reducer for modifying a document within a collection or
 * subcollection. When storeAs is being used, subcollections are
 * moved to the level of the storeAs (instead of on their parent doc).
 * @param {Array} [collectionState=[]] - Redux state of current collection
 * @param {object} action - The action that was dispatched
 * @returns {Array} State with document modified
 */
function modifyDoc(collectionState, action) {
  // Support moving a doc within an array
  if (action.payload.ordered) {
    const { newIndex, oldIndex } = action.payload.ordered;
    // newIndex value exists, item was within array before, and the index has changed
    if (!!newIndex && oldIndex > -1 && newIndex !== oldIndex) {
      return newArrayWithItemMoved(
        collectionState,
        action.meta,
        action.payload.ordered,
        action.payload.data,
      );
    }
  }

  if (!action.meta.subcollections || action.meta.storeAs) {
    return updateItemInArray(collectionState, action.meta.doc, item =>
      // Merge is no longer used to prevent removal of subcollections since this will change in v1
      ({ id: action.meta.doc, ...action.payload.data }),
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

/**
 * Case reducer for adding a document to a collection or subcollection.
 * @param {Array} [array=[]] - Redux state of current collection
 * @param {object} action - The action that was dispatched
 * @returns {Array} State with document modified
 */
function addDoc(array = [], action) {
  const { meta, payload } = action;
  if (!meta.subcollections || meta.storeAs) {
    return [
      ...array.slice(0, payload.ordered.newIndex),
      { id: meta.doc, ...payload.data },
      ...array.slice(payload.ordered.newIndex),
    ];
  }

  // Add doc to subcollection by modifying the existing doc at this level
  return modifyDoc(array, action);
}

/**
 * Case reducer for adding a document to a collection.
 * @param {Array} array - Redux state of current collection
 * @param {object} action - The action that was dispatched
 * @returns {Array} State with document modified
 */
function removeDoc(array, action) {
  // Update is at doc level (not subcollection level)
  if (!action.meta.subcollections || action.meta.storeAs) {
    // Remove doc from collection array
    return reject(array, { id: action.meta.doc }); // returns a new array
  }
  // Update is at subcollection level
  const subcollectionSetting = action.meta.subcollections[0];

  // Meta does not contain doc, remove whole subcollection
  if (!subcollectionSetting.doc) {
    return updateItemInArray(
      array,
      action.meta.doc,
      item => omit(item, [subcollectionSetting.collection]), // omit creates a new object
    );
  }

  // Meta contains doc setting, remove doc from subcollection
  return updateItemInArray(array, action.meta.doc, item => {
    const subcollectionVal = get(item, subcollectionSetting.collection, []);
    // Subcollection exists within doc, update item within subcollection
    if (subcollectionVal.length) {
      return {
        ...item,
        [subcollectionSetting.collection]: reject(array, {
          id: subcollectionSetting.doc,
        }),
      };
    }
    // Item does not contain subcollection
    return item;
  });
}

/**
 * Case reducer for writing/updating a whole collection.
 * @param {Array} collectionState - Redux state of current collection
 * @param {object} action - The action that was dispatched
 * @returns {Array} State with document modified
 */
function writeCollection(collectionState, action) {
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
    return map(action.payload.ordered, newDocObj => {
      const existingDoc = get(existingKeys, newDocObj.id);
      // merge with existing doc if existing doc is not equal
      return !!existingDoc && !isEqual(existingDoc, newDocObj)
        ? { ...existingDoc, ...newDocObj }
        : newDocObj;
    });
  }

  // Handle subcollections (only when storeAs is not being used)
  if (meta.doc && meta.subcollections) {
    const subcollectionConfig = meta.subcollections[0];
    if (!collectionStateSize) {
      // Collection state does not already exist, create it with item containing
      // subcollection
      return [
        {
          id: meta.doc,
          [subcollectionConfig.collection]: action.payload.ordered,
        },
      ];
    }
    // Merge with existing document if collection state exists
    return updateItemInArray(collectionState, meta.doc, item =>
      // check if action contains ordered payload
      payloadExists
        ? // merge with existing subcollection
          {
            ...item,
            [subcollectionConfig.collection]: unionBy(
              get(item, subcollectionConfig.collection, []),
              action.payload.ordered,
              'id',
            ),
          }
        : // remove subcollection if payload is empty
          omit(item, [subcollectionConfig.collection]),
    );
  }

  if (meta.doc && collectionStateSize) {
    // don't update ordered if the doc doesn't exist
    if (!size(action.payload.ordered)) {
      return collectionState;
    }
    // Update item in array
    return updateItemInArray(collectionState, meta.doc, item =>
      mergeObjects(item, action.payload.ordered[0]),
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
 * @type {Function}
 */
const orderedCollectionReducer = createReducer(undefined, actionHandlers);

/**
 * Reducer for ordered state.
 * @param {object} [state={}] - Current ordered redux state
 * @param {object} action - The action that was dispatched
 * @param {string} action.type - Type of action that was dispatched
 * @param {string} action.meta.collection - Name of Collection which the action
 * associates with
 * @param {string} action.meta.doc - Name of Document which the action
 * associates with
 * @param {Array} action.meta.subcollections - Subcollections which the action
 * associates with
 * @param {string} action.meta.storeAs - Another key within redux store that the
 * action associates with (used for storing data under a path different
 * from its collection/document)
 * @param {object} action.payload - Object containing data associated with
 * action
 * @param {Array} action.payload.ordered - Ordered Array Data associated with
 * action
 * @returns {object} Ordered state after reduction
 */
export default function orderedReducer(state = {}, action) {
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

  // Return state if action does not contain valid meta
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
