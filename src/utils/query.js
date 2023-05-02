import {
  isObject,
  isNumber,
  isEmpty,
  trim,
  forEach,
  has,
  map,
  get,
  set,
  cloneDeep,
} from 'lodash';
import { actionTypes } from '../constants';

export const snapshotCache = new WeakMap();
/**
 * Get DocumentSnapshot and QuerySnapshot with object from either data or
 * ordered firestore state. If provided with doc data, it will return
 * DocumentSnapshot, providing with a collection from data or an array from
 * ordered state will return QuerySnapshot, except ordered state that generated
 * as DocumentRef will return DocumentSnapshot
 * Note: the cache is local and, not persistance. Passing an object from initial
 * state or from SSR state will yield undefined.
 * @param {object|Array} obj - The object from data or ordered state
 * @returns {firebase.firestore.DocumentSnapshot|firebase.firestore.QuerySnapshot}
 * DocumentSnapshot or QuerySnapshot depend on type of object provided
 */
export function getSnapshotByObject(obj) {
  return snapshotCache.get(obj);
}

/**
 * Add where claues to Cloud Firestore Reference handling invalid formats
 * and multiple where statements (array of arrays)
 * @param {firebase.firestore.Reference} ref - Reference which to add where to
 * @param {Array} where - Where statement to attach to reference
 * @returns {firebase.firestore.Reference} Reference with where statement attached
 */
function addWhereToRef(ref, where) {
  if (!Array.isArray(where)) {
    throw new Error('where parameter must be an array.');
  }

  if (Array.isArray(where[0])) {
    return where.reduce((acc, whereArgs) => addWhereToRef(acc, whereArgs), ref);
  }

  return ref.where(...where);
}

/**
 * Add attribute to Cloud Firestore Reference handling invalid formats
 * and multiple orderBy statements (array of arrays). Used for orderBy and where
 * @param {firebase.firestore.Reference} ref - Reference which to add where to
 * @param {Array} orderBy - Statement to attach to reference
 * @returns {firebase.firestore.Reference} Reference with where statement attached
 */
function addOrderByToRef(ref, orderBy) {
  if (
    !Array.isArray(orderBy) &&
    !(typeof orderBy === 'string' || orderBy instanceof String)
  ) {
    throw new Error('orderBy parameter must be an array or string.');
  }
  if (typeof orderBy === 'string' || orderBy instanceof String) {
    return ref.orderBy(orderBy);
  }
  if (typeof orderBy[0] === 'string' || orderBy[0] instanceof String) {
    return ref.orderBy(...orderBy);
  }
  return orderBy.reduce(
    (acc, orderByArgs) => addOrderByToRef(acc, orderByArgs),
    ref,
  );
}

/**
 * Convert cursor into a string array for spreading into cursor functions
 * @see https://firebase.google.com/docs/firestore/query-data/query-cursors#set_cursor_based_on_multiple_fields
 * @param {Array|string} cursor - The cursor as a string or string array
 * @returns {Array} String Array - The cursor as a string array
 */
function arrayify(cursor) {
  return [].concat(cursor);
}

/**
 * Call methods on ref object for provided subcollection list (from queryConfig
 * object)
 * @param {firebase.firestore.CollectionReference} ref - reference on which
 * to call methods to apply queryConfig
 * @param {Array} subcollectionList - List of subcollection settings from
 * queryConfig object
 * @returns {firebase.firestore.Query} Query object referencing path within
 * firestore
 */
function handleSubcollections(ref, subcollectionList) {
  if (Array.isArray(subcollectionList)) {
    subcollectionList.forEach((subcollection) => {
      /* eslint-disable no-param-reassign */
      if (subcollection.collection) {
        if (typeof ref.collection !== 'function') {
          throw new Error(
            `Collection can only be run on a document. Check that query config for subcollection: "${subcollection.collection}" contains a doc parameter.`,
          );
        }
        ref = ref.collection(subcollection.collection);
      }
      if (subcollection.id) ref = ref.doc(subcollection.id);
      if (subcollection.doc) ref = ref.doc(subcollection.doc);
      if (subcollection.where) ref = addWhereToRef(ref, subcollection.where);
      if (subcollection.orderBy) {
        ref = addOrderByToRef(ref, subcollection.orderBy);
      }
      if (subcollection.limit) ref = ref.limit(subcollection.limit);
      if (subcollection.startAt) {
        ref = ref.startAt(...arrayify(subcollection.startAt));
      }
      if (subcollection.startAfter) {
        ref = ref.startAfter(...arrayify(subcollection.startAfter));
      }
      if (subcollection.endAt) {
        ref = ref.endAt(...arrayify(subcollection.endAt));
      }
      if (subcollection.endBefore) {
        ref = ref.endBefore(...arrayify(subcollection.endBefore));
      }
      ref = handleSubcollections(ref, subcollection.subcollections);
      /* eslint-enable */
    });
  }
  return ref;
}

/**
 * Create a Cloud Firestore reference for a collection or document
 * @param {object} firebase - Internal firebase object
 * @param {object} meta - Metadata
 * @param {string} meta.collection - Collection name
 * @param {string} meta.collectionGroup - Collection Group name
 * @param {string} meta.doc - Document name
 * @param {Array} meta.where - List of argument arrays
 * @returns {firebase.firestore.Reference} Resolves with results of add call
 */
export function firestoreRef(firebase, meta) {
  if (!firebase.firestore) {
    throw new Error('Firestore must be required and initalized.');
  }
  const {
    path,
    collection,
    collectionGroup,
    id,
    doc,
    subcollections,
    where,
    orderBy,
    limit,
    startAt,
    startAfter,
    endAt,
    endBefore,
  } = meta;
  let ref = firebase.firestore();
  // TODO: Compare other ways of building ref

  if (collection && collectionGroup) {
    throw new Error(
      'Reference cannot contain both Collection and CollectionGroup.',
    );
  }
  const { globalDataConvertor } =
    (firebase && firebase._ && firebase._.config) || {};

  if (path || collection) ref = ref.collection(path || collection);
  if (collectionGroup) ref = ref.collectionGroup(collectionGroup);
  if (id || doc) ref = ref.doc(id || doc);
  ref = handleSubcollections(ref, subcollections);
  if (where) ref = addWhereToRef(ref, where);
  if (orderBy) ref = addOrderByToRef(ref, orderBy);
  if (limit) ref = ref.limit(limit);
  if (startAt) ref = ref.startAt(...arrayify(startAt));
  if (startAfter) ref = ref.startAfter(...arrayify(startAfter));
  if (endAt) ref = ref.endAt(...arrayify(endAt));
  if (endBefore) ref = ref.endBefore(...arrayify(endBefore));
  if (globalDataConvertor) ref = ref.withConverter(globalDataConvertor);
  return ref;
}

/**
 * Convert where parameter into a string notation for use in query name
 * @param {string} key - Key to use
 * @param {Array} value - Where config array
 * @returns {string} String representing where settings for use in query name
 */
function arrayToStr(key, value) {
  if (typeof value === 'string' || value instanceof String || isNumber(value)) {
    return `${key}=${value}`;
  }
  if (typeof value[0] === 'string' || value[0] instanceof String) {
    return `${key}=${value.join(':')}`;
  }
  if (value && typeof value.toString === 'function') {
    return `${key}=${value.toString()}`;
  }

  return value.map((val) => arrayToStr(key, val));
}

/**
 * Pcik query params from object
 * @param {object} obj - Object from which to pick query params
 * @returns {object} Object of query params by name
 */
function pickQueryParams(obj) {
  return [
    'where',
    'orderBy',
    'limit',
    'startAfter',
    'startAt',
    'endAt',
    'endBefore',
  ].reduce((acc, key) => (obj[key] ? { ...acc, [key]: obj[key] } : acc), {});
}

/**
 * Join/serilize query params
 * @param {object} queryParams - Query settings
 * @returns {string} Serialized string
 */
function serialize(queryParams) {
  return Object.keys(queryParams)
    .filter((key) => queryParams[key] !== undefined)
    .map((key) => arrayToStr(key, queryParams[key]))
    .join('&');
}

/**
 * Create query name based on query settings for use as object keys (used
 * in listener management and reducers).
 * @param {object} meta - Metadata object containing query settings
 * @param {string} meta.collection - Collection name of query
 * @param {string} meta.collectionGroup - Collection Group name of query
 * @param {string} meta.doc - Document id of query
 * @param {string} meta.storeAs - User-defined Redux store name of query
 * @param {Array} meta.subcollections - Subcollections of query
 * @returns {string} String representing query settings
 */
export function getQueryName(meta) {
  if (typeof meta === 'string' || meta instanceof String) {
    return meta;
  }
  const {
    path,
    collection,
    collectionGroup,
    id,
    doc,
    subcollections,
    storeAs,
    ...remainingMeta
  } = meta;
  if (!path && !collection && !collectionGroup) {
    throw new Error(
      'Collection or Collection Group is required to build query name',
    );
  }

  if (storeAs) {
    return storeAs;
  }

  let basePath = path || collection || collectionGroup;
  if (id || doc) {
    basePath = basePath.concat(`/${id || doc}`);
  }
  if ((path || collection) && subcollections) {
    /* eslint-disable no-console */
    console.error(
      'Queries with subcollections must use "storeAs" to prevent invalid store updates. This closley matches the upcoming major release (v1), which stores subcollections at the top level by default.',
    );
    /* eslint-enable no-console */
    const mappedCollections = subcollections.map((subcollection) =>
      getQueryName(subcollection),
    );
    basePath = `${basePath}/${mappedCollections.join('/')}`;
  }

  const queryParams = pickQueryParams(remainingMeta);

  if (!isEmpty(queryParams)) {
    if (queryParams.where && !Array.isArray(queryParams.where)) {
      throw new Error('where parameter must be an array.');
    }
    basePath = basePath.concat('?', serialize(queryParams));
  }
  return basePath;
}

/**
 * Create query name based on query settings for use as object keys (used
 * in listener management and reducers).
 * @param {object} meta - Metadata object containing query settings
 * @param {string} meta.collection - Collection name of query
 * @param {string} meta.collectionGroup - Collection Group name of query
 * @param {string} meta.doc - Document id of query
 * @param {Array} meta.subcollections - Subcollections of query
 * @returns {string} String representing query settings
 */
export function getBaseQueryName(meta) {
  if (typeof meta === 'string' || meta instanceof String) {
    return meta;
  }
  const {
    path,
    collection,
    collectionGroup,
    subcollections,
    ...remainingMeta
  } = meta;
  if (!path && !collection && !collectionGroup) {
    throw new Error(
      'Collection or Collection Group is required to build query name',
    );
  }
  let basePath = path || collection || collectionGroup;

  if ((path || collection) && subcollections) {
    const mappedCollections = subcollections.map((subcollection) =>
      getQueryName(subcollection),
    );
    basePath = `${basePath}/${mappedCollections.join('/')}`;
  }

  const queryParams = pickQueryParams(remainingMeta);

  if (!isEmpty(queryParams)) {
    if (queryParams.where && !Array.isArray(queryParams.where)) {
      throw new Error('where parameter must be an array.');
    }
    basePath = basePath.concat('?', serialize(queryParams));
  }

  return basePath;
}

/**
 * Confirm that meta object exists and that listeners object exists on internal
 * firebase instance. If these required values do not exist, an error is thrown.
 * @param {object} firebase - Internal firebase object
 * @param {object} meta - Metadata object
 */
function confirmMetaAndConfig(firebase, meta) {
  if (!meta) {
    throw new Error('Meta data is required to attach listener.');
  }
  if (!firebase || !firebase._ || !firebase._.listeners) {
    throw new Error(
      'Internal Firebase object required to attach listener. Confirm that reduxFirestore enhancer was added when you were creating your store',
    );
  }
}

/**
 * Get whether or not a listener is attached at the provided path
 * @param {object} firebase - Internal firebase object
 * @param {object} meta - Metadata object
 * @returns {boolean} Whether or not listener exists
 */
export function listenerExists(firebase, meta) {
  confirmMetaAndConfig(firebase, meta);
  const name = getQueryName(meta);
  return !!firebase._.listeners[name];
}

/**
 * @description Update the number of watchers for a query
 * @param {object} firebase - Internal firebase object
 * @param {Function} dispatch - Redux's dispatch function
 * @param {object} meta - Metadata
 * @param {Function} unsubscribe - Unsubscribe function
 * @returns {object} Object containing all listeners
 */
export function attachListener(firebase, dispatch, meta, unsubscribe) {
  confirmMetaAndConfig(firebase, meta);

  const name = getQueryName(meta);
  if (!firebase._.listeners[name]) {
    firebase._.listeners[name] = unsubscribe; // eslint-disable-line no-param-reassign
  }

  dispatch({
    type: actionTypes.SET_LISTENER,
    meta,
    payload: { name },
  });

  return firebase._.listeners;
}

/**
 * Remove/Unset a watcher
 * @param {object} firebase - Internal firebase object
 * @param {Function} dispatch - Redux's dispatch function
 * @param {object} meta - Metadata
 * @param {string} meta.collection - Collection name
 * @param {string} meta.doc - Document name
 */
export function detachListener(firebase, dispatch, meta) {
  const name = getQueryName(meta);
  if (firebase._.listeners[name]) {
    firebase._.listeners[name]();
    delete firebase._.listeners[name]; // eslint-disable-line no-param-reassign
  }
  const { preserveCacheAfterUnset: preserveCache } = firebase._.config || {};

  dispatch({
    type: actionTypes.UNSET_LISTENER,
    meta,
    payload: { name, preserveCache },
  });
}

/**
 * Turn query string into a query config object
 * @param {string} queryPathStr String to be converted
 * @param {string} parsedPath - Already parsed path (used instead of attempting parse)
 * @returns {object} Object containing collection, doc and subcollection
 */
export function queryStrToObj(queryPathStr, parsedPath) {
  const pathArr = parsedPath || trim(queryPathStr, ['/']).split('/');
  const [collection, doc, ...subcollections] = pathArr;
  const queryObj = {};
  if (collection) queryObj.collection = collection;
  if (doc) queryObj.doc = doc;
  if (subcollections.length) {
    queryObj.subcollections = [queryStrToObj('', subcollections)];
  }
  return queryObj;
}

/**
 * Convert array of querys into an array of query config objects.
 * This normalizes things for later use.
 * @param {object|string} query - Query setups in the form of objects or strings
 * @returns {object} Query setup normalized into a queryConfig object
 */
export function getQueryConfig(query) {
  if (typeof query === 'string' || query instanceof String) {
    return queryStrToObj(query);
  }
  if (isObject(query)) {
    if (!query.collection && !query.collectionGroup && !query.doc) {
      throw new Error(
        'Collection, Collection Group and/or Doc are required parameters within query definition object.',
      );
    }
    return query;
  }
  throw new Error(
    'Invalid Path Definition: Only Strings and Objects are accepted.',
  );
}

/**
 * Convert array of querys into an array of queryConfig objects
 * @param {Array} queries - Array of query strings/objects
 * @returns {Array} watchEvents - Array of watch events
 */
export function getQueryConfigs(queries) {
  if (Array.isArray(queries)) {
    return queries.map(getQueryConfig);
  }
  if (typeof queries === 'string' || queries instanceof String) {
    return queryStrToObj(queries);
  }
  if (isObject(queries)) {
    return [getQueryConfig(queries)];
  }
  throw new Error('Querie(s) must be an Array or a string.');
}

/**
 * Get ordered array from snapshot
 * @param {firebase.database.DataSnapshot} snap - Data for which to create
 * an ordered array.
 * @returns {Array|null} Ordered list of children from snapshot or null
 */
export function orderedFromSnap(snap) {
  const ordered = [];
  if (snap.data && snap.exists) {
    const {
      id,
      ref: {
        parent: { path },
      },
    } = snap;
    const obj = isObject(snap.data())
      ? { ...(snap.data() || snap.data), id, path }
      : { id, path, data: snap.data() };
    snapshotCache.set(obj, snap);
    ordered.push(obj);
  } else if (snap.forEach) {
    snap.forEach((doc) => {
      const {
        id,
        ref: {
          parent: { path },
        },
      } = doc;
      const obj = isObject(doc.data())
        ? { ...(doc.data() || doc.data), id, path }
        : { id, path, data: doc.data() };
      snapshotCache.set(obj, doc);
      ordered.push(obj);
    });
  }
  snapshotCache.set(ordered, snap);
  return ordered;
}

/**
 * Create data object with values for each document with keys being doc.id.
 * @param {firebase.database.DataSnapshot} snap - Data for which to create
 * an ordered array.
 * @returns {object|null} Object documents from snapshot or null
 */
export function dataByIdSnapshot(snap) {
  const data = {};
  if (snap.data) {
    const snapData = snap.exists ? snap.data() : null;
    if (snapData) {
      snapshotCache.set(snapData, snap);
      data[snap.id] = {
        ...snapData,
        id: snap.id,
        path: snap.ref.parent.path,
      };
    } else {
      data[snap.id] = null;
    }
  } else if (snap.forEach) {
    snap.forEach((doc) => {
      const snapData = doc.data() || doc;
      snapshotCache.set(snapData, doc);
      data[doc.id] = {
        ...snapData,
        id: doc.id,
        path: doc.ref.parent.path,
      };
    });
  }
  if (!!data && Object.keys(data).length) {
    snapshotCache.set(data, snap);
    return data;
  }
  return null;
}

/**
 * Create an array of promises for population of an object or list
 * @param {object} firebase - Internal firebase object
 * @param {object} populate - Object containing root to be populate
 * @param {object} populate.root - Firebase root path from which to load populate item
 * @param {string} id - String id
 * @returns {Promise} Resolves with populate child data
 */
function getPopulateChild(firebase, populate, id) {
  return firestoreRef(firebase, { collection: populate.root, doc: id })
    .get()
    .then((snap) => ({ id, ...snap.data() }));
}

/**
 * Populate list of data
 * @param {object} firebase - Internal firebase object
 * @param {object} originalObj - Object to have parameter populated
 * @param {object} p - Object containing populate information
 * @param {object} results - Object containing results of population from other populates
 * @returns {Promise} Resolves with populated list
 */
function populateList(firebase, originalObj, p, results) {
  // Handle root not being defined
  if (!results[p.root]) {
    set(results, p.root, {});
  }
  return Promise.all(
    map(originalObj, (id, childKey) => {
      // handle list of keys
      const populateKey = id === true || p.populateByKey ? childKey : id;
      return getPopulateChild(firebase, p, populateKey).then((pc) => {
        if (pc) {
          // write child to result object under root name if it is found
          return set(results, `${p.root}.${populateKey}`, pc);
        }
        return results;
      });
    }),
  );
}

/**
 * Create standardized populate object from strings or objects
 * @param {string|object} str - String or Object to standardize into populate object
 * @returns {object} Populate object
 */
function getPopulateObj(str) {
  if (typeof str === 'string' || str instanceof String) {
    return str;
  }
  const strArray = str.split(':');
  // TODO: Handle childParam
  return { child: strArray[0], root: strArray[1] };
}

/**
 * Create standardized populate object from strings or objects
 * @param {Array} arr - Array of items to get populate objects for
 * @returns {Array} Array of populate objects
 */
function getPopulateObjs(arr) {
  if (!Array.isArray(arr)) {
    return arr;
  }
  return arr.map((o) => (isObject(o) ? o : getPopulateObj(o)));
}

/**
 * Create an array of promises for population of an object or list
 * @param {object} firebase - Internal firebase object
 * @param {object} dataKey - Object to have parameter populated
 * @param {object} originalData - String containing population data
 * @param {object|Function} populatesIn - Populates setting
 * @returns {Promise} Resolves with results of population
 */
function promisesForPopulate(firebase, dataKey, originalData, populatesIn) {
  // TODO: Handle selecting of parameter to populate with (i.e. displayName of users/user)
  const promisesArray = [];
  const results = {};

  // test if data is a single object, try generating populates and looking for the child
  const populatesForData = getPopulateObjs(
    typeof populatesIn === 'function'
      ? populatesIn(dataKey, originalData)
      : populatesIn,
  );

  const dataHasPopulateChilds = populatesForData.some((populate) =>
    has(originalData, populate.child),
  );
  if (dataHasPopulateChilds) {
    // Data is a single object, resolve populates directly
    populatesForData.forEach((p) => {
      const childDataVal = get(originalData, p.child);
      if (typeof childDataVal === 'string' || childDataVal instanceof String) {
        return promisesArray.push(
          getPopulateChild(firebase, p, childDataVal).then((v) => {
            // write child to result object under root name if it is found
            if (v) {
              set(
                results,
                `${p.storeAs ? p.storeAs : p.root}.${childDataVal}`,
                v,
              );
            }
          }),
        );
      }

      // Single Parameter is list
      return promisesArray.push(
        populateList(firebase, childDataVal, p, results),
      );
    });
  } else {
    // Data is a list of objects, each value has parameters to be populated
    // { '1': {someobject}, '2': {someobject} }
    forEach(originalData, (d, key) => {
      // generate populates for this data item if a fn was passed
      const populatesForDataItem = getPopulateObjs(
        typeof populatesIn === 'function' ? populatesIn(key, d) : populatesIn,
      );

      // resolve each populate for this data item
      forEach(populatesForDataItem, (p) => {
        // get value of parameter to be populated (key or list of keys)
        const idOrList = get(d, p.child);

        /* eslint-disable consistent-return */
        // Parameter/child of list item does not exist
        if (!idOrList) {
          return;
        }

        // Parameter of each list item is single ID
        if (typeof idOrList === 'string' || idOrList instanceof String) {
          return promisesArray.push(
            // eslint-disable-line
            getPopulateChild(firebase, p, idOrList).then((v) => {
              // write child to result object under root name if it is found
              if (v) {
                set(
                  results,
                  `${p.storeAs ? p.storeAs : p.root}.${idOrList}`,
                  v,
                );
              }
              return results;
            }),
          );
        }

        // Parameter of each list item is a list of ids
        if (Array.isArray(idOrList) || isObject(idOrList)) {
          // Create single promise that includes a promise for each child
          return promisesArray.push(
            // eslint-disable-line
            populateList(firebase, idOrList, p, results),
          );
        }
      });
    });
  }

  // Return original data after population promises run
  return Promise.all(promisesArray).then(() => results);
}

const changeTypeToEventType = {
  added: actionTypes.DOCUMENT_ADDED,
  removed: actionTypes.DOCUMENT_REMOVED,
  modified: actionTypes.DOCUMENT_MODIFIED,
};

/**
 * Action creator for document change event. Used to create action objects
 * to be passed to dispatch.
 * @param {object} change - Document change object from Firebase callback
 * @param {object} [originalMeta={}] - Original meta data of action
 * @returns {object} Resolves with doc change action object
 */
function docChangeEvent(change, originalMeta = {}) {
  const meta = { ...cloneDeep(originalMeta), path: change.doc.ref.parent.path };
  if (originalMeta.subcollections && !originalMeta.storeAs) {
    meta.subcollections[0] = { ...meta.subcollections[0], doc: change.doc.id };
  } else {
    meta.doc = change.doc.id;
  }
  const data = {
    id: change.doc.id,
    path: change.doc.ref.parent.path,
    ...change.doc.data(),
  };
  return {
    type: changeTypeToEventType[change.type] || actionTypes.DOCUMENT_MODIFIED,
    meta,
    payload: {
      data,
      ordered: { oldIndex: change.oldIndex, newIndex: change.newIndex },
    },
  };
}

/**
 * Dispatch action(s) response from listener response.
 * @private
 * @param {object} opts - Options object
 * @param {Function} opts.dispatch - Redux action dispatch function
 * @param {object} opts.firebase - Firebase instance
 * @param {object} opts.docData - Data object from document
 * @param {object} opts.meta - Meta data
 */
export function dispatchListenerResponse({
  dispatch,
  docData,
  meta,
  firebase,
}) {
  const {
    mergeOrdered,
    mergeOrderedDocUpdates,
    mergeOrderedCollectionUpdates,
  } = firebase._.config || {};
  const fromCache =
    typeof docData.metadata?.fromCache === 'boolean'
      ? docData.metadata.fromCache
      : true;
  const docChanges =
    typeof docData.docChanges === 'function'
      ? docData.docChanges()
      : docData.docChanges;
  // Dispatch different actions for doc changes (only update doc(s) by key)
  if (docChanges && docChanges.length < docData.size) {
    // Loop to dispatch for each change if there are multiple
    // TODO: Option for dispatching multiple changes in single action
    docChanges.forEach((change, index) => {
      const lastChange = index === docChanges.length - 1;
      dispatch(docChangeEvent(change, { reprocess: lastChange, ...meta }));
    });
  } else {
    // Dispatch action for whole collection change
    dispatch({
      type: actionTypes.LISTENER_RESPONSE,
      meta,
      payload: {
        data: dataByIdSnapshot(docData),
        ordered: orderedFromSnap(docData),
        fromCache,
      },
      merge: {
        docs: mergeOrdered && mergeOrderedDocUpdates,
        collections: mergeOrdered && mergeOrderedCollectionUpdates,
      },
    });
  }
}

/**
 * Get list of actions for population queries
 * @private
 * @param {object} opts - Options object
 * @param {object} opts.firebase - Firebase instance
 * @param {object} opts.docData - Data object from document
 * @param {object} opts.meta - Meta data
 * @returns {Promise} Resolves with a list of populate actions containing data
 */
export function getPopulateActions({ firebase, docData, meta }) {
  // Run promises for population
  return promisesForPopulate(
    firebase,
    docData.id,
    dataByIdSnapshot(docData),
    meta.populates,
  )
    .then((populateResults) =>
      // Listener results for each child collection
      Object.keys(populateResults).map((resultKey) => ({
        // TODO: Handle population of subcollection queries
        meta: { collection: resultKey },
        payload: {
          data: populateResults[resultKey],
          // TODO: Write ordered here
        },
        requesting: false,
        requested: true,
      })),
    )
    .catch((populateErr) => {
      console.error('Error with populate:', populateErr, meta); // eslint-disable-line no-console
      return Promise.reject(populateErr);
    });
}
