/* eslint-disable jsdoc/valid-types, jsdoc/check-types */
import produce from 'immer';
import { Timestamp } from 'firebase/firestore'; // eslint-disable-line import/no-extraneous-dependencies
import {
  set,
  unset,
  filter,
  flow,
  orderBy,
  take,
  map,
  partialRight,
  zip,
  setWith,
  findIndex,
  isMatch,
  get,
  isEqual,
  takeRight,
  isEmpty,
  identity,
} from 'lodash';
import { actionTypes } from '../constants';
import { getBaseQueryName } from '../utils/query';

/**
 * @typedef {object.<string, RRFQuery>} CacheState
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
 * @typedef {{ id: FirestoreDocumentId, path: FirestorePath } & firestore.FirestoreDocument} ParitalDoc
 * @typedef {Array.<string>} Populates - [field_name, firestore_path_to_collection, new_field_name]
 * @typedef {Array.<string>} Fields - document fields to include for the result
 * @typedef {Array<*> & { 0: FirestorePath, 1: FirestoreDocumentId, length: 2 }} OrderedTuple
 * @property {object} - Some
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
 * @typedef {object} Mutation_v1
 * @property {string} collection - firestore path into the parent collection
 * @property {string} doc - firestore document id
 * @property {object} data - document to be saved
 */

/**
 * @typedef {object} Mutation_v2
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
 * @property {object.<string, RRFQuery>} reads - Object of read keys and queries
 * @property {Function[]} writes - Array of function that take rtdbKey results and return writes
 */

/**
 * @typedef MutateAction_v1
 * @property {Write | Batch | Transaction} payload - mutation payload
 * @property {object} meta - Meta object
 */

const isTimestamp = (a) => a instanceof Object && a.seconds !== undefined;

const PROCESSES = {
  '<': (a, b) => a < b,
  '<=': (a, b) => a <= b,
  '==': (a, b) => a === b,
  '!=': (a, b) => a !== b,
  '>=': (a, b) => a >= b,
  '>': (a, b) => a > b,
  'array-contains': (a, b) => a.includes(b),
  in: (a, b) => Array.isArray(b) && b.includes(a),
  'array-contains-any': (a, b) => b.some((b1) => a.includes(b1)),
  'not-in': (a, b) => !b.includes(a),
  '*': () => true,
};

const PROCESSES_TIMESTAMP = {
  '<': (a, b) =>
    a.seconds < b.seconds ||
    (a.seconds === b.seconds && a.nanoseconds < b.nanoseconds),
  '<=': (a, b) =>
    a.seconds < b.seconds ||
    (a.seconds === b.seconds && a.nanoseconds <= b.nanoseconds),
  '==': (a, b) => a.seconds === b.seconds && a.nanoseconds === b.nanoseconds,
  '!=': (a, b) => a.seconds !== b.seconds || a.nanoseconds !== b.nanoseconds,
  '>=': (a, b) =>
    a.seconds > b.seconds ||
    (a.seconds === b.seconds && a.nanoseconds >= b.nanoseconds),
  '>': (a, b) =>
    a.seconds > b.seconds ||
    (a.seconds === b.seconds && a.nanoseconds > b.nanoseconds),
  'array-contains': (a, b) => a.includes(b),
  in: (a, b) => Array.isArray(b) && b.includes(a),
  'array-contains-any': (a, b) => b.some((b1) => a.includes(b1)),
  'not-in': (a, b) => !b.includes(a),
  '*': () => true,
};

const xfVerbose = (title) => partialRight(map, (data) => data);

/**
 * @name xfAllIds
 * @param {string} path - string of the full firestore path for the collection
 * @typedef xFormCollection - return a single collection from the fragment database
 * @returns {xFormCollection} - transducer
 */
const xfAllIds = ({ collection: path }) =>
  function allIdsTransducer(state) {
    const { database: db = {}, databaseOverrides: dbo = {} } = state;
    const allIds = new Set([
      ...Object.keys(db[path] || {}),
      ...Object.keys(dbo[path] || {}),
    ]);

    return [Array.from(allIds).map((id) => [path, id])];
  };

/**
 * @name xfWhere
 * @param {object} getDoc - Object
 * @param {Array.<Array.<string>>} getDoc.where - Firestore where clauses
 * @property {object.<FirestorePath, object<FirestoreDocumentId, Doc>>} db - DB
 * @property {object.<FirestorePath, object<FirestoreDocumentId, ParitalDoc>>} dbo - DB
 * @typedef {Function} xFormFilter - run the same where cause sent to
 * firestore for all the optimistic overrides
 * @returns {xFormFilter} - transducer
 */
const xfWhere = ({ where }, getDoc) => {
  if (!where) return [partialRight(map, identity)];

  const isFlat = typeof where[0] === 'string';
  const clauses = isFlat ? [where] : where;

  return clauses.map(([field, op, val]) => {
    const fnc = isTimestamp(val)
      ? PROCESSES_TIMESTAMP[op]
      : PROCESSES[op] || (() => true);

    return partialRight(map, (tuples) =>
      filter(tuples, ([path, id] = []) => {
        if (!path || !id) return false;
        let value;
        if (field === '__name__') {
          value = id;
        } else if (field.includes('.')) {
          value = field
            .split('.')
            .reduce((obj, subField) => obj && obj[subField], getDoc(path, id));
        } else {
          value = getDoc(path, id)[field];
        }

        if (value === undefined) value = null;

        return fnc(value, val);
      }),
    );
  });
};

/**
 * @name xfOrder
 * @param {object} getDoc - Object
 * @param {Array.<string>} getDoc.orderBy - Firestore order property
 * @property {object.<FirestorePath, object<FirestoreDocumentId, Doc>>}  db - Db
 * @property {object.<FirestorePath, object<FirestoreDocumentId, ParitalDoc>>} dbo - DBO
 * @typedef {Function} xFormOrdering - sort docs bases on criteria from the
 * firestore query
 * @returns {xFormOrdering} - transducer
 */
const xfOrder = ({ orderBy: order }, getDoc) => {
  if (!order) return identity;

  const isFlat = typeof order[0] === 'string';
  const orders = isFlat ? [order] : order;

  const [fields, direction] = zip(
    ...orders.map(([field, dir]) => [
      (data) => {
        if (typeof data[field] === 'string') return data[field].toLowerCase();
        if (isTimestamp(data[field])) return data[field].seconds;
        return data[field];
      },
      dir || 'asc',
    ]),
  );

  return partialRight(map, (tuples) => {
    // TODO: refactor to manually lookup and compare
    const docs = tuples.map(([path, id]) => getDoc(path, id));

    return orderBy(docs, fields, direction).map(
      ({ id, path } = {}) => path && id && [path, id],
    );
  });
};

/**
 * @name xfLimit
 * @param {number} limit - firestore limit number
 * @typedef {Function} xFormLimiter - limit the results to align with
 * limit from the firestore query
 * @returns {xFormLimiter} - transducer
 */
const xfLimit = ({ limit, endAt, endBefore }) => {
  if (!limit) return identity;
  const fromRight = (endAt || endBefore) !== undefined;
  return fromRight
    ? ([arr] = []) => [takeRight(arr, limit)]
    : ([arr] = []) => [take(arr, limit)];
};

/**
 * @name xfPaginate
 * @param {RRFQuery} query - Firestore query
 * @param {object} getDoc - Get doc function
 * @typedef {Function} xFormFilter - in optimistic reads and overrides
 * the reducer needs to take all documents and make a best effort to
 * filter down the document based on a cursor.
 * @returns {xFormFilter} - transducer
 */
const xfPaginate = (query, getDoc) => {
  const {
    orderBy: order,
    limit,
    startAt,
    startAfter,
    endAt,
    endBefore,
  } = query;

  const start = startAt || startAfter;
  const end = endAt || endBefore;
  const isAfter = startAfter !== undefined;
  const isBefore = endBefore !== undefined;
  const needsPagination = start || end || false;

  if (!needsPagination || !order) return identity;

  const isFlat = typeof order[0] === 'string';
  const orders = isFlat ? [order] : order;
  const isPaginateMatched = (document, at, before = false, after = false) =>
    orders.find(([field, sort = 'asc'], idx) => {
      const value = Array.isArray(at) ? at[idx] : at;
      if (value === undefined) return false;

      // TODO: add support for document refs
      const isTime = isTimestamp(document[field]);
      const proc = isTime ? PROCESSES_TIMESTAMP : PROCESSES;
      let compare = process['=='];
      if (startAt || endAt) compare = proc[sort === 'desc' ? '<=' : '>='];
      if (startAfter || endBefore) compare = proc[sort === 'desc' ? '<' : '>'];

      const isMatched = compare(document[field], value);
      return isMatched;
    }) !== undefined;

  return partialRight(map, (tuples) => {
    const results = [];
    let started = start === undefined;

    tuples.forEach(([path, id]) => {
      if (limit && results.length >= limit) return;

      if (!started && start) {
        if (isPaginateMatched(getDoc(path, id), start, undefined, isAfter)) {
          started = true;
        }
      }

      if (started && end) {
        if (isPaginateMatched(getDoc(path, id), end, isBefore, undefined)) {
          started = false;
        }
      }

      if (started) {
        results.push([path, id]);
      }
    });
    return results;
  });
};

/**
 * Convert the query to a transducer for the query results
 * @param {RRFQuery} query - query used to get data from firestore
 * @param {object} state - State object
 * @returns {Function} - Transducer will return a modifed array of documents
 */
function processOptimistic(query, state) {
  const { database, databaseOverrides } = state;
  const { via = 'memory', collection } = query;
  const db = (database && database[collection]) || {};
  const dbo = databaseOverrides && databaseOverrides[collection];

  const getDoc = (path, id) => {
    const data = db[id] || {};
    const override = dbo?.[id];

    return override ? { ...data, ...override } : data;
  };

  const process = flow([
    xfAllIds(query),

    xfVerbose('xfAllIds'),

    ...xfWhere(query, getDoc),

    xfVerbose('xfWhere'),

    xfOrder(query, getDoc),

    xfVerbose('xfOrder'),

    xfPaginate(query, getDoc),

    xfVerbose('xfPaginate'),

    xfLimit(query),

    xfVerbose('xfLimit'),
  ]);

  const ordered = process(state)[0];
  return via === 'memory' && ordered.length === 0 ? undefined : ordered;
}

const skipReprocessing = (query, { databaseOverrides = {} }) => {
  const { collection, via } = query;
  const fromFirestore = ['cache', 'server'].includes(via);
  const hasNoOverrides = isEmpty(databaseOverrides[collection]);

  if (fromFirestore && hasNoOverrides) return true;

  return false;
};

/**
 * @name reprocessQueries
 * Rerun all queries that contain the same collection
 * @param {object} draft - reducer state
 * @param {string} path - path to rerun queries for
 */
function reprocessQueries(draft, path) {
  const queries = [];

  const paths = Array.isArray(path) ? path : [path];
  const overrides = draft.databaseOverrides?.[path];
  Object.keys(draft).forEach((key) => {
    if (['database', 'databaseOverrides'].includes(key)) return;
    if (!paths.includes(draft[key].collection)) return;
    if (skipReprocessing(draft[key], draft)) return;

    queries.push(key);

    // either was processed via reducer or had optimistic data
    const ordered = processOptimistic(draft[key], draft);

    if (
      !draft[key].ordered ||
      (ordered ?? []).toString() !== (draft[key].ordered ?? []).toString()
    ) {
      set(draft, [key, 'ordered'], ordered);
      set(draft, [key, 'via'], !isEmpty(overrides) ? 'optimistic' : 'memory');
    }
  });
}

// --- Mutate support ---

/**
 * Not a Mutate, just an array
 * @param {Array} arr - Array
 * @returns {null | Array} Value
 */
const primaryValue = (arr) =>
  typeof arr[0] === 'string' && arr[0].indexOf('::') === 0 ? null : arr;

/**
 * Mutate Nested Object
 * @param {*} obj - data
 * @param {*} key - nested key path
 * @param {*} val - value to be set
 * @returns {null | object} Nested map
 */
const nestedMap = (obj, key, val) => {
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

const arrayUnion = (key, val, cached) =>
  key !== '::arrayUnion' ? null : (cached() || []).concat([val]);

const arrayRemove = (key, val, cached) =>
  key === '::arrayRemove' && (cached() || []).filter((item) => item !== val);

const increment = (key, val, cached) =>
  key === '::increment' && typeof val === 'number' && (cached() || 0) + val;

const serverTimestamp = (key) => key === '::serverTimestamp' && Timestamp.now();

/**
 * Process Mutation to a vanilla JSON
 * @param {*} mutation - payload mutation
 * @param {Function} cached - function that returns in-memory cached instance
 * @returns {object} JSON Object
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
 * @param {object} action - Redux action
 * @param {object} action.payload - Action payload
 * @param {object.<FirestorePath, object<FirestoreDocumentId, Doc>>} db - in-memory database
 * @param {object.<FirestorePath, object<FirestoreDocumentId, Doc>>} dbo - in-memory database overrides
 * @returns {Array<object<FirestoreDocumentId, Doc>>} List of overrides
 */
function translateMutationToOverrides({ payload }, db = {}, dbo = {}) {
  // turn everything to a write
  let { reads, writes } = payload.data || {};
  if (!writes) {
    writes = Array.isArray(payload.data) ? payload.data : [payload.data];
  } else if (!Array.isArray(writes)) {
    writes = [writes];
  }

  // grab reads sync from in-memory database
  let optimistic = {};
  if (reads) {
    optimistic = Object.keys(reads).reduce((result, key) => {
      if (typeof reads[key] === 'function') {
        return { ...result, [key]: reads[key]() };
      }

      const path = reads[key]?.path || reads[key]?.collection;
      const id = reads[key]?.id || reads[key]?.doc;

      const collection = db[path] || {};
      const overrides = dbo[path] || {};
      return {
        ...result,
        [key]: { id, path, ...collection[id], ...(overrides[id] || {}) },
      };
    }, {});
  }

  const overrides = writes
    .map((writer) =>
      typeof writer === 'function' ? writer(optimistic) : writer,
    )
    .filter((data) => !data || !isEmpty(data))
    .reduce(
      (flat, result) => [
        ...flat,
        ...(Array.isArray(result) ? result : [result]),
      ],
      [],
    )
    .map((write) => {
      const { collection, path, doc, id, data, ...rest } = write;

      const coll = path || collection;
      const docId = id || doc;
      return {
        path: coll,
        id: docId,
        ...atomize(collection ? data : rest, (key) => {
          const database = Object.keys(db).length > 0 ? db : {};
          const location = database[coll] || {};
          return (location[docId] || {})[key];
        }),
      };
    });

  return overrides;
}

/**
 * @param {object} draft - reduce state
 * @param {object} action - Redux action
 * @param {string} action.path - path of the parent collection
 * @param {string} action.id - document id
 * @param {object} action.data - data in the payload
 */
function cleanOverride(draft, { path, id, data }) {
  if (!path || !id) return;

  const override = get(draft, ['databaseOverrides', path, id], false);

  if (!override || (data && !isMatch(data, override))) return;

  const keys = Object.keys(override);
  const props = !data
    ? keys
    : keys.filter((key) => {
        // manually check draft proxy values
        const current = get(data, key);
        const optimistic = override[key];

        if (current === null || current === undefined) {
          return current === optimistic;
        }
        if (Array.isArray(current)) {
          return current.every((val, idx) => val === optimistic[idx]);
        }
        if (typeof current === 'object') {
          return Object.keys(current).every(
            (currentKey) => current[currentKey] === optimistic[currentKey],
          );
        }
        return isEqual(data[key], override[key]);
      });

  const isDone = props.length === Object.keys(override).length;
  const dataIsEmpty =
    isDone && Object.keys(draft.databaseOverrides[path] || {}).length === 1;

  if (dataIsEmpty) {
    unset(draft, ['databaseOverrides', path]);
  } else if (isDone) {
    unset(draft, ['databaseOverrides', path, id]);
  } else {
    props.forEach((prop) => {
      unset(draft, ['databaseOverrides', path, id, prop]);
    });
  }
}

// --- action type handlers ---

const initialize = (state, { action, key, path }) =>
  produce(state, (draft) => {
    if (!draft.database) {
      set(draft, ['database'], {});
      set(draft, ['databaseOverrides'], {});
    }
    const hasOptimistic = !isEmpty(draft.databaseOverrides?.[path]);

    const via = {
      undefined: hasOptimistic ? 'optimistic' : 'memory',
      true: 'cache',
      false: 'server',
    }[action.payload.fromCache];

    // 35%
    if (action.payload.data) {
      Object.keys(action.payload.data).forEach((id) => {
        setWith(draft, ['database', path, id], action.payload.data[id], Object);

        cleanOverride(draft, { path, id, data: action.payload.data[id] });
      });
    }

    // set the query
    const ordered =
      action.payload.ordered?.map(({ path: _path, id }) => [_path, id]) ||
      processOptimistic(action.meta, draft);

    // 20%
    set(draft, [action.meta.storeAs], {
      ordered,
      ...action.meta,
      via,
    });

    // 15%
    reprocessQueries(draft, path);

    return draft;
  });

const conclude = (state, { action, key, path }) =>
  produce(state, (draft) => {
    if (draft[key]) {
      if (!action.payload.preserveCache) {
        // remove query
        unset(draft, [key]);
      }

      reprocessQueries(draft, path);
    }

    return draft;
  });

const modify = (state, { action, key, path }) =>
  produce(state, (draft) => {
    setWith(
      draft,
      ['database', path, action.meta.doc],
      action.payload.data,
      Object,
    );

    cleanOverride(draft, {
      path,
      id: action.meta.doc,
      data: action.payload.data,
    });

    const { payload } = action;
    const { oldIndex = 0, newIndex = 0 } = payload.ordered || {};

    if (newIndex !== oldIndex) {
      const tuple =
        (payload.data && [payload.data.path, payload.data.id]) ||
        draft[key].ordered[oldIndex];

      const { ordered } = draft[key] || { ordered: [] };
      const idx = findIndex(ordered, [1, action.meta.doc]);

      const isIndexChange = idx !== -1;
      const isAddition = oldIndex === -1 || isIndexChange;
      const isRemoval = newIndex === -1 || isIndexChange;

      if (isRemoval && idx > -1) {
        ordered.splice(idx, 0);
      } else if (isAddition) {
        ordered.splice(newIndex, 0, tuple);
      }

      set(draft, [key, 'ordered'], ordered);
    }

    // reprocessing unifies any order changes from firestore
    if (action.meta.reprocess !== false) {
      reprocessQueries(draft, path);
    }

    return draft;
  });

const failure = (state, { action, key, path }) =>
  produce(state, (draft) => {
    // All failures remove overrides
    if (action.payload.data || action.payload.args) {
      const write = action.payload.data
        ? [{ writes: [action.payload.data] }]
        : action.payload.args;
      const allPaths = write.reduce(
        (results, { writes }) => [
          ...results,
          ...writes.map(({ collection, path: _path, doc, id }) => {
            // don't send data to ensure document override is deleted
            cleanOverride(draft, { path: _path || collection, id: id || doc });

            return path || collection;
          }),
        ],
        [],
      );

      const uniquePaths = Array.from(new Set(allPaths));
      if (uniquePaths.length > 0) {
        reprocessQueries(draft, uniquePaths);
      }
    }

    return draft;
  });

const deletion = (state, { action, key, path }) =>
  produce(state, (draft) => {
    if (draft.database && draft.database[path]) {
      unset(draft, ['database', path, action.meta.doc]);
    }

    cleanOverride(draft, { path, id: action.meta.doc });

    // remove document id from ordered index
    if (draft[key] && draft[key].ordered) {
      const idx = findIndex(draft[key].ordered, [1, action.meta.doc]);
      draft[key].ordered.splice(idx, 1);
    }

    // reprocess
    reprocessQueries(draft, path);

    return draft;
  });

const remove = (state, { action, key, path }) =>
  produce(state, (draft) => {
    cleanOverride(draft, {
      path,
      id: action.meta.doc,
      data: action.payload.data,
    });

    // remove document id from ordered index
    if (draft[key] && draft[key].ordered) {
      const idx = findIndex(draft[key].ordered, [1, action.meta.doc]);
      const wasNotAlreadyRemoved = idx !== -1;
      if (wasNotAlreadyRemoved) {
        draft[key].ordered.splice(idx, 1);
      }
    }

    // reprocess
    reprocessQueries(draft, path);

    return draft;
  });

const optimistic = (state, { action, key, path }) =>
  produce(state, (draft) => {
    setWith(
      draft,
      ['databaseOverrides', path, action.meta.doc],
      action.payload.data,
      Object,
    );

    reprocessQueries(draft, path);
    return draft;
  });

const reset = (state, { action, key, path }) =>
  produce(state, (draft) => {
    cleanOverride(draft, { path, id: action.meta.doc });

    reprocessQueries(draft, path);
    return draft;
  });

const mutation = (state, { action, key, path }) => {
  const { _promise } = action;
  try {
    const result = produce(state, (draft) => {
      if (action.payload && action.payload.data) {
        const optimisiticUpdates =
          translateMutationToOverrides(action, draft.database) || [];

        optimisiticUpdates.forEach((data) => {
          setWith(
            draft,
            ['databaseOverrides', data.path, data.id],
            data,
            Object,
          );
        });

        const updatePaths = [
          ...new Set(optimisiticUpdates.map(({ path: _path }) => _path)),
        ];

        updatePaths.forEach((_path) => {
          reprocessQueries(draft, _path);
        });
      }

      _promise?.resolve();

      return draft;
    });

    return result;
  } catch (error) {
    _promise?.reject(error);
    return state;
  }
};

const HANDLERS = {
  [actionTypes.SET_LISTENER]: initialize,
  [actionTypes.LISTENER_RESPONSE]: initialize,
  [actionTypes.GET_SUCCESS]: initialize,
  [actionTypes.UNSET_LISTENER]: conclude,
  [actionTypes.DOCUMENT_ADDED]: modify,
  [actionTypes.DOCUMENT_MODIFIED]: modify,
  [actionTypes.DELETE_SUCCESS]: deletion,
  [actionTypes.DOCUMENT_REMOVED]: remove,
  [actionTypes.OPTIMISTIC_ADDED]: optimistic,
  [actionTypes.OPTIMISTIC_MODIFIED]: optimistic,
  [actionTypes.OPTIMISTIC_REMOVED]: reset,
  [actionTypes.MUTATE_FAILURE]: failure,
  [actionTypes.DELETE_FAILURE]: failure,
  [actionTypes.UPDATE_FAILURE]: failure,
  [actionTypes.SET_FAILURE]: failure,
  [actionTypes.ADD_FAILURE]: failure,
  [actionTypes.MUTATE_START]: mutation,
};

/**
 * @name cacheReducer
 * Reducer for in-memory database
 * @param {object} [state={}] - Current listenersById redux state
 * @param {object} action - Object containing the action that was dispatched
 * @param {string} action.type - Type of action that was dispatched
 * @returns {object} Queries state
 */
export default function cacheReducer(state = {}, action) {
  const fnc = HANDLERS[action.type];
  if (!fnc) return state;

  const key =
    !action.meta || !action.meta.collection
      ? null
      : action.meta.storeAs || getBaseQueryName(action.meta);
  const path = !action.meta ? null : action.meta.collection;

  return fnc(state, { action, key, path });
}
