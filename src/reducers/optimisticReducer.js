import produce from 'immer';
import { set, get, unset, filter, flow, orderBy, take, map, merge, partialRight, pick } from 'lodash';
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

function buildTransducer(overrides, {collection, where, orderBy:order, limit, ordered}) {
  const identity = d => d
  const useFirestoreSort = !overrides;
  const getCollection = partialRight(map, state => state.database[collection]);
  
  if (useFirestoreSort) {
    const ids = ordered.map(([__, id]) => id)
    return flow(
      getCollection,
      partialRight(map, docs => ids.map(id => docs[id])),
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
    getCollection,
    ...applyOverrides,
    // partialRight(map, (data) => {console.log(">>", data); return data;}),
    ...xfFilter,
    xfOrder,
    xfLimit,
  ]);
}

function selectDocuments(state, meta) {
  // console.log(meta.collection, meta.where)
  const transduce = buildTransducer(state.overrides, meta);
  return transduce([state])[0]
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
        // eslint-disable-line no-param-reassign
        if (!draft.database) {
          draft.database = {}
        }
        draft.database[path] = merge(draft.database[path] || {}, action.payload.data)
        
        draft[key] = { 
          ordered: action.payload.ordered.map(({id, path}) => [path, id]),
          ...action.meta };
          draft[key].results = selectDocuments(draft, draft[key])
          
        return draft;
      case actionTypes.UNSET_LISTENER:
        if (draft[key]) {
          draft[key].data = undefined; // eslint-disable-line no-param-reassign
          draft[key].results = undefined; // eslint-disable-line no-param-reassign
          draft[key].ordered = undefined; // eslint-disable-line no-param-reassign
        }
        return draft;
      case actionTypes.DOCUMENT_ADDED:
      case actionTypes.DOCUMENT_MODIFIED:
        set(draft, ['database', path, action.meta.doc], action.payload.data);
        set(draft, [key, 'results'], selectDocuments(draft, draft[key]));
        // TODO: insert into order array

        // TODO: check if matches override, then remove
        return draft;
      case actionTypes.DOCUMENT_REMOVED:
      case actionTypes.DELETE_SUCCESS:
        unset(draft, ['database', path, action.meta.doc]);
        set(draft, [key, 'results'], selectDocuments(draft, draft[key]));
        // TODO: remove from ordered array
        return draft;

      case actionTypes.OPTIMISTIC_ADDED:
      case actionTypes.OPTIMISTIC_MODIFIED:
        set(draft, ['overrides', path], action.payload.data);
        
        // synchronusly filter/sort all queries on this collection type
        Object.keys(draft).forEach(key => {
          const {collection} = draft[key]
          if (!collection || collection !== path) return;

          set(draft, [key, 'results'], selectDocuments(draft, draft[key]));
        });
        return draft;
      case actionTypes.OPTIMISTIC_REMOVED:
        set(draft, ['overrides', path, action.meta.doc], null);
        Object.keys(draft).forEach(key => {
          const {collection} = draft[key]
          if (!collection || collection !== path) return;

          set(draft, [key, 'results'], selectDocuments(draft, draft[key]));
        });
        return draft;

      default:
        return state;
    }
  });
}
