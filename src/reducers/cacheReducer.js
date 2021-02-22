import produce from 'immer';
import { set, unset, filter, flow, orderBy, take, map, merge, partialRight, pick, reject, compact, zip } from 'lodash';
import { actionTypes } from '../constants';
import { getBaseQueryName } from '../utils/query';

/**
 * @typedef {object & Object.<string, RRFQuery>} CacheState
 * Cache state is a synchronus, in-memory fragment of Firestore. This solves a key design
 * shortcoming in firestore of not having a synchronous, optimistic API. Specifically
 * drag & drop UI that requires a transaction offer a terrible user experience. 
 * @property {Object.<FirestorePath, Object<FirestoreDocumentId, Doc>>}  database 
 * Store in-memory documents returned from firestore, with no modifiactions.
 * @property {Object.<FirestorePath, Object<FirestoreDocumentId, ParitalDoc>>}  overrides 
 * Store document fragments that are in-flight to be persisted to firestore.
 */

/**
 * @typedef {string} FirestorePath
 * @typedef {string} FirestoreDocumentId
 * @typedef {object} FirestoreDocument
 * @typedef {{ id: FirestoreDocumentId, path: FirestorePath } & FirestoreDocument} Doc
 * @typedef {{ id: FirestoreDocumentId, path: FirestorePath } & ?FirestoreDocument} ParitalDoc
 * @typedef {Array.<string>} Populates - array of document field name, related collection path, new property name
 * @typedef {Array.<string>} Fields - document fields to include for the result
 * @typedef {Array<*> & { 0: FirestorePath, 1: FirestoreDocumentId, length: 2 }} OrderedTuple 
 */

/**
 * @typedef {object & {fields: Fields, populates: Populates, docs: Doc[], ordered: OrderedTuple}} RRFQuery
 * @property {string|object} collection - React Redux Firestore collection path
 * @property {?string} storeAs - alias to store the query results
 * @property {?Array.<string>} where - Firestore Query tuple
 * @property {?Array.<string>} orderBy - Firestore Query orderBy 
 * @property {?Fields} fields - Optional fields to pick for each document
 * @property {?Populates} populates - Optional related docs to include
 * @property {Doc[]} docs - Array of documents that includes the overrides, 
 * field picks and populate merges
 * @property {OrderedTuple} ordered - Tuple of [path, doc_id] results returned
 * from firestore. Overrides do NOT mutate this field. All reordering
 * comes from running the filter & orderBy xForms.
 */


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

/**
 * @typedef {function} xFormDocument - uses ordered ids to get docs from database
 */
const getDocumentTransducer = (ids) => 
  partialRight(map, coll => ids.map(id => coll[id]))

/**
 * @typedef {function} xFormCollection - gets collection for state
 */
const getCollectionTransducer = (collection) => 
  partialRight(map, state => state.database[collection]);

/**
 * @typedef {function} xFormPartialFields - pick selected doc fields to 
 * improve React rendering performance
 */
const fieldsTransducer = (fields) => 
  partialRight(map, docs => docs.map(doc => pick(doc, fields)))

/**
 * @typedef {function} xFormOrdering - sort docs bases on criteria from the 
 * firestore query
 */
const orderTransducer = (order) => {
  const isFlat = typeof order[0] === 'string';
  const orders = isFlat ? [order] : order;
  return partialRight.apply(null, [orderBy, ...zip.apply(null, orders)]);
};

/**
 * @typedef {function} xFormLimiter - limit the results to align with 
 * limit from the firestore query
 */
const limitTransducer = (limit) => partialRight(take, limit);

/**
 * @typedef {function} xFormFilter - run the same where cause sent to 
 * firestore for all the optimitic overrides
 */
const filterTransducers = (where) => 
  where.map(([field, op, val]) => (
    partialRight(map, collection => 
      filter(Object.values(collection), doc => 
        doc[field] && PROCESSES[op](doc[field], val)
      )
    )
  ));

/**
 * @typedef {function} xFormPopulate - run the populate when a firestore listener 
 * triggers instead of on a case by case basis in the selector
 */
const populateTransducer = (collection, populates) => {
  return partialRight(map, state => {
    // NOTE: this is costly for the entire collection, done at the end is better
    const parent = JSON.parse(JSON.stringify(state.database[collection]))
    populates.forEach(([id, siblingCollection, field]) => {
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
};

/**
 * @typedef {function} xFormOverrides - takes synchronous, in-memory change
 * requests and applies them to the in-memory database
 */
const overridesTransducers = (overrides, collection) => {
  const docs = overrides[collection];
  return Object.keys(docs).map(docId => 
    partialRight(map, 
      collection => 
        !docs[docId] 
        ? unset(collection, docId)
        : merge(collection, {[docId]: docs[docId]}))
    );
};

/**
 * @typedef {function} Function prints data and returns for the next xForm
 */
const xfSpy = partialRight(map, (data) => {
  console.log(data); 
  return data;
});

/**
 * Convert the query to a transducer for the query results
 * @param {?CacheState.overrides} overrides - 
 * @param {RRFQuery} query - query used to get data from firestore
 * @returns {function} Function that results query results + overrides
 */
function buildTransducer(overrides, query) {
  const { collection, where, orderBy:order, limit, ordered, fields, populates } = query;

  const shouldResortDocuments = !overrides;

  const xfGetCollection = getCollectionTransducer(collection);
  const xfPopulate = !populates ? null : populateTransducer(collection, populates);
  const xfFields = !fields ? null : fieldsTransducer(fields);
  const xfGetDoc = getDocumentTransducer(ordered.map(([__, id]) => id))
  
  if (shouldResortDocuments) {
    return flow(
      compact([
        xfPopulate,
        xfGetCollection,
        xfGetDoc,
        xfFields,
      ])
    );
  }
  
  const xfApplyOverrides = overridesTransducers(overrides, collection);
  const xfFilter = filterTransducers(where);
  const xfOrder = !order ? null : orderTransducer(order);
  const xfLimit = limit ? null : limitTransducer(limit);

  return flow(
    compact([
      xfPopulate,
      xfGetCollection,
      ...xfApplyOverrides,
      // xfSpy,
      ...xfFilter,
      xfOrder,
      xfLimit,
      xfFields,
    ])
  );
}

/**
 * Reducer for in-memory database
 * @param {object} reducerState - optimitic redux state 
 * @param {RRFQuery} meta - query from the meta field of the action
 * @returns {object} updated reducerState
 */
function selectDocuments(reducerState, meta) {
  const transduce = buildTransducer(reducerState.overrides, meta);
  return transduce([reducerState])[0]
}

/**
 * Reducer for in-memory database
 * @param {object} state - optimitic redux state 
 * @param {RRFQuery} meta - query from the meta field of the action
 * @returns {object} updated reducerState
 */
function updateCollectionQueries(draft, path){
  Object.keys(draft).forEach(key => {
    const {collection, populates} = draft[key]
    if (!collection || collection !== path && !(populates && populates[1] !== path)) return;

    set(draft, [key, 'docs'], selectDocuments(draft, draft[key]));
  });
}

/**
 * Reducer for in-memory database
 * @param {object} [state={}] - Current listenersById redux state
 * @param {object} action - Object containing the action that was dispatched
 * @param {string} action.type - Type of action that was dispatched
 * @returns {object} Queries state
 */
export default function cacheReducer(state = {}, action) {
  return produce(state, draft => {
    
    const key = !action.meta ? null : action.meta.storeAs || getBaseQueryName(action.meta);
    const path = !action.meta ? null : action.meta.collection

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

        const shouldRemvoveOverride = draft.overrides && 
          draft.overrides[path] && 
          draft.overrides[path][action.meta.doc];
        if (shouldRemvoveOverride) {
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
        if(draft.overrides && draft.overrides[path]) {
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
