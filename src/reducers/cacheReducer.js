import produce from 'immer';
import {
  set,
  unset,
  filter,
  flow,
  orderBy,
  take,
  map,
  partialRight,
  pick,
  reject,
  compact,
  zip,
  setWith,
  extend,
  isFunction,
  findIndex,
} from 'lodash';
import { actionTypes } from '../constants';
import { getBaseQueryName } from '../utils/query';

/**
 * @typedef {object & Object.<string, RRFQuery>} CacheState
 * Cache state is a synchronous, in-memory fragment of Firestore. The primary
 * goal is to provide instant, synchronous data mutations. The key use case to consider
 * is when React has a drag and drop interface but the data change requires a
 * transaction which must round-trip to the server before it's reflected in Redux.
 * @property {object.<FirestorePath, object<FirestoreDocumentId, Doc>>}  database
 * Store in-memory documents returned from firestore, with no modifications.
 * @property {object.<FirestorePath, object<FirestoreDocumentId, ParitalDoc>>}  databaseOverrides
 * Store document fragments that are in-flight to be persisted to firestore.
 */

/**
 * @typedef {string} FirestorePath
 * @typedef {string} FirestoreDocumentId
 * @typedef {object} FirestoreDocument
 * @typedef {{ id: FirestoreDocumentId, path: FirestorePath } & FirestoreDocument} Doc
 * @typedef {{ id: FirestoreDocumentId, path: FirestorePath } & ?FirestoreDocument} ParitalDoc
 * @typedef {Array.<string>} Populates - [field_name, firestore_path_to_collection, new_field_name]
 * @typedef {Array.<string>} Fields - document fields to include for the result
 * @typedef {Array<*> & { 0: FirestorePath, 1: FirestoreDocumentId, length: 2 }} OrderedTuple
 * @property
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

/**
 * @typedef {Object} Mutation_v1
 * @property {string} collection - firestore path into the parent collection
 * @property {string} doc - firestore document id
 * @property {Object} data - document to be saved
 */

/**
 * @typedef {Object} Mutation_v2
 * The full document to be saved in firestore with 2 additional properties
 * @property {string} path - firestore path into the parent collection
 * @property {string} id - firestore document id
 * ...rest - the rest of the data will be saved to as the firestore doc
 */

/**
 * @typedef {Mutation_v1 | Mutation_v2} Write
 * @typedef {Array<Mutation_v1 | Mutation_v2>} Batch
 */

/**
 * @typedef {object} Transaction
 * @property {object.<ReadKey, RRFQuery>} reads - Object of read keys and queries
 * @property {Function[]} writes - Array of function that take rekyKey results and return writes
 */

/**
 * @typedef MutateAction_v1
 * @property {Write | Batch | Transaction} payload - mutation payload
 * @property {object} meta
 */

const PROCESSES = {
  '<': (a, b) => a < b,
  '<=': (a, b) => a <= b,
  '==': (a, b) => a === b,
  '!=': (a, b) => a !== b,
  '>=': (a, b) => a >= b,
  '>': (a, b) => a > b,
  'array-contains': (a, b) => a.includes(b),
  in: (a, b) => a.includes(b),
  'array-contains-any': (a, b) => a.includes(b),
  'not-in': (a, b) => !a.includes(b),
  '*': () => true,
};

/**
 * @name getDocumentTransducer
 * @param ids - array of document ids
 * @typedef {Function} xFormDocument - use cache[storeAs].ordered to get
 * documents from cache.database
 * @returns {xFormDocument} - transducer
 */
const getDocumentTransducer = (ids) =>
  partialRight(map, (coll) => ids.map((id) => coll[id]));

/**
 * @name getCollectionTransducer
 * @param {string} collection - stirng of the full firestore path for the collection
 * @typedef xFormCollection - return a single collection from the fragment database
 * @returns {xFormCollection} - transducer
 */
const getCollectionTransducer = (collection) =>
  partialRight(map, (state) => state.database[collection]);

/**
 * @name fieldsTransducer
 * @param {Array.<string>} fields - properties of the document to include in the return
 * @typedef {Function} xFormPartialFields - pick selected doc fields to
 * improve React rendering performance
 * @returns {xFormPartialFields} - transducer
 */
const fieldsTransducer = (fields) =>
  partialRight(map, (docs) => docs.map((doc) => pick(doc, fields)));

/**
 * @name orderTransducer
 * @param {Array.<string>} order - Firestore order property
 * @typedef {Function} xFormOrdering - sort docs bases on criteria from the
 * firestore query
 * @returns {xFormOrdering} - transducer
 */
const orderTransducer = (order) => {
  const isFlat = typeof order[0] === 'string';
  const orders = isFlat ? [order] : order;
  return partialRight.apply(null, [orderBy, ...zip.apply(null, orders)]);
};

/**
 * @name limitTransducer
 * @param {number} limit - firestore limit number
 * @typedef {Function} xFormLimiter - limit the results to align with
 * limit from the firestore query
 * @returns {xFormLimiter} - transducer
 */
const limitTransducer = (limit) => partialRight(take, limit);

/**
 * @name filterTransducers
 * @param {Array.<Array.<string>>} where - Firestore where clauses
 * @typedef {Function} xFormFilter - run the same where cause sent to
 * firestore for all the optimitic overrides
 * @returns {xFormFilter} - transducer
 */
const filterTransducers = (where) => {
  const isFlat = typeof where[0] === 'string';
  const clauses = isFlat ? [where] : where;

  return clauses.map(([field, op, val]) => {
    const fnc = PROCESSES[op] || (() => true);
    return partialRight(map, (collection) =>
      filter(Object.values(collection), (doc) => fnc(doc[field], val)),
    );
  });
};
/**
 * @name populateTransducer
 * @param {string} collection - path to collection in Firestore
 * @param {Array.<Populates>} populates - array of populates
 * @typedef {Function} xFormPopulate - run the populate when a firestore listener
 * triggers instead of on a case by case basis in the selector
 * @returns {xFormPopulate}
 */
const populateTransducer = (collection, populates) =>
  partialRight(map, (state) => {
    const parent = JSON.parse(JSON.stringify(state.database[collection] || {}));
    populates.forEach(([id, siblingCollection, field]) => {
      const sibling = state.database[siblingCollection];
      Object.values(parent).forEach((doc) => {
        const siblingId = doc[id];
        const siblingDoc = sibling && sibling[siblingId];
        if (siblingDoc) {
          doc[field] = JSON.parse(JSON.stringify(siblingDoc));
        }
      });
    });
    return { database: { [collection]: parent } };
  });

/**
 * @name overridesTransducers
 * @param {object} overrides - mirrored structure to database but only with updates
 * @param {string} collection - path to firestore collection
 * @typedef {Function} xFormOverrides - takes synchronous, in-memory change
 * requests and applies them to the in-memory database
 * @returns {xFormOverrides}
 */
const overridesTransducers = (overrides, collection) => {
  const partials = (overrides && overrides[collection]) || {};
  return Object.keys(partials).map((docId) =>
    partialRight(map, (coll) =>
      partials[docId] === null
        ? unset(coll, docId)
        : set(coll, [docId], extend({}, coll[docId], partials[docId])),
    ),
  );
};

// eslint-disable-next-line no-unused-vars
const xfSpy = partialRight(map, (data) => {
  // eslint-disable-next-line no-console
  console.log('xf-spy: ', JSON.parse(JSON.stringify(data)));
  return data;
});

/**
 * @name buildTransducer
 * Convert the query to a transducer for the query results
 * @param {?CacheState.databaseOverrides} overrides -
 * @param {RRFQuery} query - query used to get data from firestore
 * @returns {Function} - Transducer will return a modifed array of documents
 */
function buildTransducer(overrides, query) {
  const {
    collection,
    where,
    orderBy: order,
    limit,
    ordered,
    fields,
    populates,
  } = query;

  const useOverrides = JSON.stringify(overrides || {}) !== '{}';

  const xfPopulate = !populates
    ? null
    : populateTransducer(collection, populates);
  const xfGetCollection = getCollectionTransducer(collection);
  const xfGetDoc = getDocumentTransducer(ordered.map(([__, id]) => id));
  const xfFields = !fields ? null : fieldsTransducer(fields);

  const xfApplyOverrides = !useOverrides
    ? null
    : overridesTransducers(overrides, collection);
  const xfFilter =
    !useOverrides || filterTransducers(!where ? ['', '*', ''] : where);
  const xfOrder = !useOverrides || !order ? null : orderTransducer(order);
  const xfLimit = !useOverrides || limit ? null : limitTransducer(limit);

  if (!useOverrides) {
    return flow(compact([xfPopulate, xfGetCollection, xfGetDoc, xfFields]));
  }

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
    ]),
  );
}

/**
 * @name selectDocuments
 * Merge overrides with database cache and resort/filter when needed
 * @param {object} reducerState - optimitic redux state
 * @param {RRFQuery} query - query from the meta field of the action
 * @returns {object} updated reducerState
 */
function selectDocuments(reducerState, query) {
  const transduce = buildTransducer(reducerState.databaseOverrides, query);
  return transduce([reducerState])[0];
}

/**
 * @name updateCollectionQueries
 * Rerun all queries that contain the same collection
 * @param {object} draft - reducer state
 * @param {string} path - path to rerun queries for
 */
function updateCollectionQueries(draft, path) {
  Object.keys(draft).forEach((key) => {
    const { collection, populates } = draft[key];
    if (
      !collection ||
      (collection !== path && !(populates && populates[1] !== path))
    )
      return;

    set(draft, [key, 'docs'], selectDocuments(draft, draft[key]));
  });
}

// --- Mutate support ---

/**
 * Not a Mutate, just an array
 * @param {Array} arr
 * @returns Null | Array
 */
const primaryValue = (arr) =>
  typeof arr[0] === 'string' && arr[0].indexOf('::') === 0 ? null : arr;

/**
 * Mutate Nested Object
 * @param {*} obj - data
 * @param {*} key - nested key path
 * @param {*} val - value to be set
 * @returns Null | object
 */
const nestedMap = (obj, key, val) => {
  if (!key.includes('.')) return null;
  // eslint-disable-next-line no-param-reassign
  delete obj[key];
  const fields = key.split('.');
  fields.reduce((deep, field, idx) => {
    // eslint-disable-next-line no-param-reassign
    if (deep[field] === undefined) deep[field] = {};
    // eslint-disable-next-line no-param-reassign
    if (idx === fields.length - 1) deep[field] = val;
    return deep[field];
  }, obj);
  return obj;
};

/**
 * Mutate ArrayUnion
 * @param {string} key - mutate tuple key
 * @param {*} val - mutate tuple value
 * @param {Function} cached - function that returns in-memory cached instance
 * @returns Null | Array<*>
 */
function arrayUnion(key, val, cached) {
  if (key !== '::arrayUnion') return null;
  return (cached() || []).concat([val]);
}

/**
 * Mutate arrayRemove
 * @param {string} key - mutate tuple key
 * @param {*} val - mutate tuple value
 * @param {Function} cached - function that returns in-memory cached instance
 * @returns Null | Array<*>
 */
function arrayRemove(key, val, cached) {
  return (
    key === '::arrayRemove' && (cached() || []).filter((item) => item !== val)
  );
}

/**
 * Mutate increment
 * @param {string} key - mutate tuple key
 * @param {*} val - mutate tuple value
 * @param {Function} cached - function that returns in-memory cached instance
 * @returns Null | number
 */
const increment = (key, val, cached) =>
  key === '::increment' && typeof val === 'number' && (cached() || 0) + val;

/**
 * Mutate timestamp
 * @param {*} key
 * @returns
 */
const serverTimestamp = (key) => key === '::serverTimestamp' && new Date();

/**
 * Process Mutation to a vanilla JSON
 * @param {*} mutation - payload mutation
 * @param {Function} cached - function that returns in-memory cached instance
 * @returns
 */
function atomize(mutation, cached) {
  return Object.keys(mutation).reduce((data, key) => {
    const val = data[key];
    if (key.includes('.')) {
      nestedMap(data, key, val);
    } else if (Array.isArray(val) && val.length > 0) {
      // eslint-disable-next-line no-param-reassign
      data[key] =
        primaryValue(val) ||
        serverTimestamp(val[0]) ||
        arrayUnion(val[0], val[1], () => cached(key)) ||
        arrayRemove(val[0], val[1], () => cached(key)) ||
        increment(val[0], val[1], () => cached(key));
    }
    return data;
  }, JSON.parse(JSON.stringify(mutation)));
}
/**
 * Translate mutation to a set of database overrides
 * @param {MutateAction} action - Standard Redux action
 * @param {object.<FirestorePath, object<FirestoreDocumentId, Doc>>} db - in-memory database
 * @returns Array<object<FirestoreDocumentId, Doc>>
 */
function translateMutationToOverrides({ payload }, db) {
  // turn everything to a write
  let { reads, writes } = payload.data || {};
  if (!writes) {
    writes = Array.isArray(payload.data) ? payload.data : [payload.data];
  } else if (!Array.isArray(writes)) {
    writes = [writes];
  }

  // grab reads sync from in-memory database
  let reader = {};
  if (reads) {
    reader = Object.keys(reads).reduce((result, key) => {
      const { collection, doc } = result[key];
      if (!doc) {
        throw new Error("Cache Reducer currently doesn't support queries.");
      }
      const coll = db[collection] || {};
      return {
        ...result,
        [key]: coll[doc],
      };
    }, reads);
  }

  return writes
    .map((writer) => (isFunction(writer) ? writer(reader) : writer))
    .map(({ collection, path, doc, id, data, ...rest }) => ({
      collection: path || collection,
      doc: id || doc,
      data: atomize(data || rest, (key) => {
        const overrides = Object.keys(db).length > 0 ? db : {};
        const coll = overrides[path || collection] || {};
        return (coll[id || doc] || {})[key];
      }),
    }));
}

/**
 * @name cacheReducer
 * Reducer for in-memory database
 * @param {object} [state={}] - Current listenersById redux state
 * @param {object} action - Object containing the action that was dispatched
 * @param {string} action.type - Type of action that was dispatched
 * @returns {object} Queries state
 */
export default function cacheReducer(state = {}, action) {
  return produce(state, (draft) => {
    const key =
      !action.meta || !action.meta.collection
        ? null
        : action.meta.storeAs || getBaseQueryName(action.meta);
    const path = !action.meta ? null : action.meta.collection;

    switch (action.type) {
      case actionTypes.GET_SUCCESS:
      case actionTypes.LISTENER_RESPONSE:
        if (!draft.database) {
          set(draft, ['database'], {});
          set(draft, ['databaseOverrides'], {});
        }

        if (action.payload.data) {
          Object.keys(action.payload.data).forEach((id) => {
            setWith(
              draft,
              ['database', path, id],
              action.payload.data[id],
              Object,
            );
          });
        }

        // set the query
        set(draft, [key], {
          ordered: action.payload.ordered.map(({ path, id }) => [path, id]),
          ...action.meta,
        });

        // append docs field to query
        updateCollectionQueries(draft, path);

        return draft;
      case actionTypes.UNSET_LISTENER:
        if (draft[key]) {
          // all ids for the collection type, except query to be unset
          const activeIds = Object.keys(draft).reduce((inUse, dbKey) => {
            const { collection, ordered } = draft[dbKey];
            if (dbKey !== key && collection === path) {
              console.log('remove', dbKey, key);
              return [...inUse, ...ordered.map(([___, id]) => id)];
            }

            return inUse;
          }, []);

          // remove docs from database if unsed by other queries
          draft[key].ordered.forEach(([__, id]) => {
            console.log('activeIds', activeIds, id);
            if (!activeIds.includes(id)) {
              unset(draft, ['database', path, id]);
            }
          });

          // remove query
          unset(draft, [key]);

          updateCollectionQueries(draft, path);
        }
        return draft;

      case actionTypes.DOCUMENT_ADDED:
      case actionTypes.DOCUMENT_MODIFIED:
        setWith(
          draft,
          ['database', path, action.meta.doc],
          action.payload.data,
          Object,
        );

        const shouldRemvoveOverride =
          draft.databaseOverrides &&
          draft.databaseOverrides[path] &&
          draft.databaseOverrides[path][action.meta.doc];
        if (shouldRemvoveOverride) {
          unset(draft, ['databaseOverrides', path, action.meta.doc]);
        }

        const { payload } = action;
        const { oldIndex = 0, newIndex = 0 } = payload.ordered || {};
        if (newIndex !== oldIndex) {
          const tuple =
            (payload.data && [payload.data.path, payload.data.id]) ||
            draft[key].ordered[oldIndex];

          const { ordered } = draft[key] || { ordered: [] };
          if (oldIndex !== -1) {
            ordered.splice(oldIndex, 0);
          }
          ordered.splice(newIndex, 0, tuple);

          set(draft, [key, 'ordered'], ordered);
        }

        updateCollectionQueries(draft, path);
        return draft;

      case actionTypes.DOCUMENT_REMOVED:
      case actionTypes.DELETE_SUCCESS:
        if (draft.databaseOverrides && draft.databaseOverrides[path]) {
          unset(draft, ['databaseOverrides', path, action.meta.doc]);
        }

        // remove document id from ordered index
        if (draft[key] && draft[key].ordered) {
          const idx = findIndex(draft[key].ordered, [1, action.meta.doc]);
          unset(draft, [key, 'ordered', idx]);
        }

        // reprocess
        updateCollectionQueries(draft, path);
        return draft;

      case actionTypes.OPTIMISTIC_ADDED:
      case actionTypes.OPTIMISTIC_MODIFIED:
        setWith(
          draft,
          ['databaseOverrides', path, action.meta.doc],
          action.payload.data,
          Object,
        );

        updateCollectionQueries(draft, path);
        return draft;

      case actionTypes.OPTIMISTIC_REMOVED:
        set(draft, ['databaseOverrides', path, action.meta.doc], null);

        updateCollectionQueries(draft, path);
        return draft;

      case actionTypes.MUTATE_START:
        if (action.payload && action.payload.data) {
          const optimisiticUpdates =
            translateMutationToOverrides(action, draft.database) || [];

          optimisiticUpdates.forEach(({ collection, doc, data }) => {
            setWith(
              draft,
              ['databaseOverrides', collection, doc],
              data,
              Object,
            );
          });

          const updatePaths = [
            ...new Set(optimisiticUpdates.map(({ collection }) => collection)),
          ];
          updatePaths.forEach((path) => {
            updateCollectionQueries(draft, path);
          });
        }

        return draft;

      default:
        return state;
    }
  });
}
