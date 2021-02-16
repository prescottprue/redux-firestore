import produce from 'immer';
import { set, unset, filter, flow, orderBy, take, map, merge, partialRight, pick, reject } from 'lodash';
import { actionTypes } from '../constants';
import { getBaseQueryName } from '../utils/query';


const PROCESSES = {
  "<": (a, b) => a < b,
  "<=": (a, b) => a <= b,
  "==": (a, b) => a === b,
  "!=": (a, b) => a !== b,
  ">=": (a, b) => a >= b,
  ">": (a, b) => a >= b,
  "<=": (a, b) => a >= b,
  "array-contains": (a, b) => a.includes(b),
  "in": (a, b) => a.includes(b),
  "array-contains-any": (a, b) => a.includes(b),
  "not-in": (a, b) => !a.includes(b),
}

function buildTransducer(overrides, query) {
  const {collection, where, orderBy:order, limit, ordered, fields, populate} = query;

  const identity = d => d
  const useFirestoreSort = !overrides;
  const getCollection = partialRight(map, state => state.database[collection]);
  const xfPopulate = !populate ? identity : partialRight(map, state => {
    // NOTE: this is costly for the entire collection, done at the end is better
    const parent = JSON.parse(JSON.stringify(state.database[collection]))
    populate.forEach(([id, siblingCollection, field]) => {
      const sibling = state.database[siblingCollection]
      Object.values(parent).forEach(doc => {
        const siblingId = doc[id];
        const siblingDoc = sibling && sibling[siblingId];
        if (siblingDoc) {
          doc[field] = JSON.parse(JSON.stringify(siblingDoc));
        }
      });
    });
    return { database: {[collection]: parent}};
  })
  const xfFields = !fields ? identity : partialRight(map, docs => docs.map(doc => pick(doc, fields)));
  
  if (useFirestoreSort) {
    const ids = ordered.map(([__, id]) => id)
    return flow(
      xfPopulate,
      getCollection,
      partialRight(map, docs => ids.map(id => docs[id])),
      xfFields,
    );
  }
  
  const docs = overrides[collection]
  const applyOverrides = Object.keys(docs).map(docId => 
    partialRight(map, 
      collection => 
        !docs[docId] 
        ? unset(collection, docId)
        : merge(collection, {[docId]: docs[docId]}))
  );
  const xfFilter = where.map(([field, op, val]) => (
    partialRight(map, collection => 
      filter(Object.values(collection), doc => 
        doc[field] && PROCESSES[op](doc[field], val)
      )
    )
  ));
  const xfOrder = !order ? identity : partialRight(orderBy, order[0], order[1] || 'asc');
  const xfLimit = limit ? identity : partialRight(take, limit)

  return flow([
    xfPopulate,
    getCollection,
    ...applyOverrides,
    // partialRight(map, (data) => {console.log(">>", data); return data;}),
    ...xfFilter,
    xfOrder,
    xfLimit,
    xfFields,
  ]);
}

function selectDocuments(state, meta) {
  const transduce = buildTransducer(state.overrides, meta);
  return transduce([state])[0]
}

function updateCollectionQueries(draft, path){
  Object.keys(draft).forEach(key => {
    const {collection, populate} = draft[key]
    if (!collection || collection !== path && !(populate && populate[1] !== path)) return;

    set(draft, [key, 'results'], selectDocuments(draft, draft[key]));
  });
}

/**
 * Reducer for queries state
 * @param {object} [state={}] - Current listenersById redux state
 * @param {object} action - Object containing the action that was dispatched
 * @param {string} action.type - Type of action that was dispatched
 * @returns {object} Queries state
 */
export default function optimisticReducer(state = {}, action) {
  return produce(state, draft => {
    
    const key = action.meta.storeAs || getBaseQueryName(action.meta);
    const path = action.meta.collection

    switch (action.type) {
      case actionTypes.GET_SUCCESS:
      case actionTypes.LISTENER_RESPONSE:
        if (!draft.database) {
          draft.database = {}
        }
        
        // eslint-disable-line no-param-reassign
        draft.database[path] = merge(draft.database[path] || {}, action.payload.data)
        
        draft[key] = { 
          ordered: action.payload.ordered.map(({id, path}) => [path, id]),
          ...action.meta 
        };

        updateCollectionQueries(draft, path);
          
        return draft;
      case actionTypes.UNSET_LISTENER:
        if (draft[key]) {
          // remove only keys from the query
          draft[key].ordered.map(([__, id]) => unset(draft, ['database', path, id]))
          unset(draft, [key]);
          updateCollectionQueries(draft, path);
        }
        return draft;

      case actionTypes.DOCUMENT_ADDED:
      case actionTypes.DOCUMENT_MODIFIED:
        set(draft, ['database', path, action.meta.doc], action.payload.data);

        const removeOverride = draft.overrides[path] && draft.overrides[path][action.meta.doc];
        if (removeOverride) {
          unset(draft, ['overrides', path, action.meta.doc]);
        }

        const { oldIndex=0, newIndex=0 } = action.payload.ordered || {};
        if (oldIndex > -1 && newIndex !== oldIndex) {
          const tuple = payload.data && [payload.data.path, payload.data.id] || 
            draft[key].ordered[oldIndex]
          draft[key].ordered.splice(oldIndex, 0)
          draft[key].ordered.splice(newIndex, 0, tuple)
        }
        
        updateCollectionQueries(draft, path);
        return draft;

      case actionTypes.DOCUMENT_REMOVED:
      case actionTypes.DELETE_SUCCESS:
        unset(draft, ['database', path, action.meta.doc]);
        if(draft.overrides[path]) {
          unset(draft, ['overrides', path, action.meta.doc]);
        }
        
        if (draft[key] && draft[key].ordered) {
          draft[key].ordered = reject(draft[key].ordered, [1, action.meta.doc])
        }
        
        updateCollectionQueries(draft, path);
        return draft;

      case actionTypes.OPTIMISTIC_ADDED:
      case actionTypes.OPTIMISTIC_MODIFIED:
        set(draft, ['overrides', path], action.payload.data);

        updateCollectionQueries(draft, path);
        return draft;

      case actionTypes.OPTIMISTIC_REMOVED:
        set(draft, ['overrides', path, action.meta.doc], null);
        
        updateCollectionQueries(draft, path);
        return draft;

      default:
        return state;
    }
  });
}
