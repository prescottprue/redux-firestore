import {
  isObject,
  isString,
  isArray,
  size,
  trim,
  forEach,
  has,
  isFunction,
} from 'lodash';
import { actionTypes } from '../constants';

/**
 * Add where claues to Cloud Firestore Reference handling invalid formats
 * and multiple where statements (array of arrays)
 * @param {firebase.firestore.Reference} ref - Reference which to add where to
 * @param {Array} where - Where statement to attach to reference
 * @return {firebase.firestore.Reference} Reference with where statement attached
 */
function addWhereToRef(ref, where) {
  if (!isArray(where)) {
    throw new Error('where parameter must be an array.');
  }
  if (isString(where[0])) {
    return where.length > 1 ? ref.where(...where) : ref.where(where[0]);
  }

  return where.reduce((acc, whereArgs) => addWhereToRef(acc, whereArgs), ref);
}

/**
 * Add attribute to Cloud Firestore Reference handling invalid formats
 * and multiple orderBy statements (array of arrays). Used for orderBy and where
 * @param {firebase.firestore.Reference} ref - Reference which to add where to
 * @param {Array} attrVal - Statement to attach to reference
 * @param {String} [attrName='where'] - Name of attribute
 * @return {firebase.firestore.Reference} Reference with where statement attached
 */
function addOrderByToRef(ref, orderBy) {
  if (!isArray(orderBy) && !isString(orderBy)) {
    throw new Error('orderBy parameter must be an array or string.');
  }
  if (isString(orderBy)) {
    return ref.orderBy(orderBy);
  }
  if (isString(orderBy[0])) {
    return ref.orderBy(...orderBy);
  }
  return orderBy.reduce(
    (acc, orderByArgs) => addOrderByToRef(acc, orderByArgs),
    ref,
  );
}

/**
 * Call methods on ref object for provided subcollection list (from queryConfig
 * object)
 * @param  {firebase.firestore.CollectionReference} ref - reference on which
 * to call methods to apply queryConfig
 * @param  {Array} subcollectionList - List of subcollection settings from
 * queryConfig object
 * @return {firebase.firestore.Query} Query object referencing path within
 * firestore
 */
function handleSubcollections(ref, subcollectionList) {
  if (subcollectionList) {
    forEach(subcollectionList, subcollection => {
      /* eslint-disable no-param-reassign */
      if (subcollection.collection) {
        if (!isFunction(ref.collection)) {
          throw new Error(
            `Collection can only be run on a document. Check that query config for subcollection: "${
              subcollection.collection
            }" contains a doc parameter.`,
          );
        }
        ref = ref.collection(subcollection.collection);
      }
      if (subcollection.doc) ref = ref.doc(subcollection.doc);
      if (subcollection.where) ref = addWhereToRef(ref, subcollection.where);
      if (subcollection.orderBy) {
        ref = addOrderByToRef(ref, subcollection.orderBy);
      }
      if (subcollection.limit) ref = ref.limit(subcollection.limit);
      if (subcollection.startAt) ref = ref.startAt(subcollection.startAt);
      if (subcollection.startAfter) {
        ref = ref.startAfter(subcollection.startAfter);
      }
      if (subcollection.endAt) ref = ref.endAt(subcollection.endAt);
      if (subcollection.endBefore) ref = ref.endBefore(subcollection.endBefore);

      ref = handleSubcollections(ref, subcollection.subcollections);
      /* eslint-enable */
    });
  }
  return ref;
}

/**
 * Create a Cloud Firestore reference for a collection or document
 * @param {Object} firebase - Internal firebase object
 * @param {Function} dispatch - Redux's dispatch function
 * @param {Object} meta - Metadata
 * @param {String} meta.collection - Collection name
 * @param {String} meta.doc - Document name
 * @param {Array} meta.where - List of argument arrays
 * @return {firebase.firestore.Reference} Resolves with results of add call
 */
export function firestoreRef(firebase, dispatch, meta) {
  if (!firebase.firestore) {
    throw new Error('Firestore must be required and initalized.');
  }
  const {
    collection,
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
  let ref = firebase.firestore().collection(collection);
  // TODO: Compare other ways of building ref
  if (doc) ref = ref.doc(doc);
  ref = handleSubcollections(ref, subcollections);
  if (where) ref = addWhereToRef(ref, where);
  if (orderBy) ref = addOrderByToRef(ref, orderBy);
  if (limit) ref = ref.limit(limit);
  if (startAt) ref = ref.startAt(startAt);
  if (startAfter) ref = ref.startAfter(startAfter);
  if (endAt) ref = ref.endAt(endAt);
  if (endBefore) ref = ref.endBefore(endBefore);
  return ref;
}

/**
 * Convert where parameter into a string notation for use in query name
 * @param  {Array} where - Where config array
 * @return {String} String representing where settings for use in query name
 */
function whereToStr(where) {
  return isString(where[0])
    ? `where=${where.join(':')}`
    : where.map(whereToStr);
}

/**
 * Create query name based on query settings for use as object keys (used
 * in listener management and reducers).
 * @param  {Object} meta - Metadata object containing query settings
 * @param  {String} meta.collection - Collection name of query
 * @param  {String} meta.doc - Document id of query
 * @param  {Array} meta.subcollections - Subcollections of query
 * @return {String} String representing query settings
 */
export function getQueryName(meta) {
  if (isString(meta)) {
    return meta;
  }
  const { collection, doc, subcollections, where, limit } = meta;
  if (!collection) {
    throw new Error('Collection is required to build query name');
  }
  let basePath = collection;
  if (doc) {
    basePath = basePath.concat(`/${doc}`);
  }
  if (subcollections) {
    const mappedCollections = subcollections.map(subcollection =>
      getQueryName(subcollection),
    );
    basePath = `${basePath}/${mappedCollections.join('/')}`;
  }
  if (where) {
    if (!isArray(where)) {
      throw new Error('where parameter must be an array.');
    }
    basePath = basePath.concat(`?${whereToStr(where)}`);
  }
  if (typeof limit !== 'undefined') {
    const limitStr = `limit=${limit}`;
    basePath = basePath.concat(`${where ? '&' : '?'}${limitStr}`);
  }
  return basePath;
}

/**
 * Confirm that meta object exists and that listeners object exists on internal
 * firebase instance. If these required values do not exist, an error is thrown.
 * @param {Object} firebase - Internal firebase object
 * @param {Object} meta - Metadata object
 */
function confirmMetaAndConfig(firebase, meta) {
  if (!meta) {
    throw new Error('Meta data is required to attach listener.');
  }
  if (!has(firebase, '_.listeners')) {
    throw new Error(
      'Internal Firebase object required to attach listener. Confirm that reduxFirestore enhancer was added when you were creating your store',
    );
  }
}

/**
 * Get whether or not a listener is attached at the provided path
 * @param {Object} firebase - Internal firebase object
 * @param {Function} dispatch - Redux's dispatch function
 * @param {Object} meta - Metadata object
 * @return {Boolean} Whether or not listener exists
 */
export function listenerExists(firebase, meta) {
  confirmMetaAndConfig(firebase, meta);
  const name = getQueryName(meta);
  return !!firebase._.listeners[name];
}

/**
 * @description Update the number of watchers for a query
 * @param {Object} firebase - Internal firebase object
 * @param {Function} dispatch - Redux's dispatch function
 * @param {Object} meta - Metadata
 * @param {String} collection - Collection name
 * @param {String} doc - Document name
 * @return {Object} Object containing all listeners
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
 * @description Remove/Unset a watcher
 * @param {Object} firebase - Internal firebase object
 * @param {Function} dispatch - Redux's dispatch function
 * @param {Object} meta - Metadata
 * @param {String} collection - Collection name
 * @param {String} doc - Document name
 */
export function detachListener(firebase, dispatch, meta) {
  const name = getQueryName(meta);
  if (firebase._.listeners[name]) {
    firebase._.listeners[name]();
    delete firebase._.listeners[name]; // eslint-disable-line no-param-reassign
  }

  dispatch({
    type: actionTypes.UNSET_LISTENER,
    meta,
    payload: { name },
  });
}

/**
 * Turn query string into a query config object
 * @param  {String} queryPathStr String to be converted
 * @return {Object} Object containing collection, doc and subcollection
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
 * @description Convert array of querys into an array of query config objects.
 * This normalizes things for later use.
 * @param {Object|String} query - Query setups in the form of objects or strings
 * @return {Object} Query setup normalized into a queryConfig object
 */
export function getQueryConfig(query) {
  if (isString(query)) {
    return queryStrToObj(query);
  }
  if (isObject(query)) {
    if (!query.collection && !query.doc) {
      throw new Error(
        'Collection and/or Doc are required parameters within query definition object.',
      );
    }
    return query;
  }
  throw new Error(
    'Invalid Path Definition: Only Strings and Objects are accepted.',
  );
}

/**
 * @description Convert array of querys into an array of queryConfig objects
 * @param {Array} queries - Array of query strings/objects
 * @return {Array} watchEvents - Array of watch events
 */
export function getQueryConfigs(queries) {
  if (isArray(queries)) {
    return queries.map(getQueryConfig);
  }
  if (isString(queries)) {
    return queryStrToObj(queries);
  }
  if (isObject(queries)) {
    return [getQueryConfig(queries)];
  }
  throw new Error('Querie(s) must be an Array or a string.');
}

/**
 * Get ordered array from snapshot
 * @param  {firebase.database.DataSnapshot} snapshot - Data for which to create
 * an ordered array.
 * @return {Array|Null} Ordered list of children from snapshot or null
 */
export function orderedFromSnap(snap) {
  const ordered = [];
  if (snap.data && snap.exists) {
    const obj = isObject(snap.data())
      ? { id: snap.id, ...(snap.data() || snap.data) }
      : { id: snap.id, data: snap.data() };
    ordered.push(obj);
  } else if (snap.forEach) {
    snap.forEach(doc => {
      const obj = isObject(doc.data())
        ? { id: doc.id, ...(doc.data() || doc.data) }
        : { id: doc.id, data: doc.data() };
      ordered.push(obj);
    });
  }
  return ordered;
}

/**
 * Create data object with values for each document with keys being doc.id.
 * @param  {firebase.database.DataSnapshot} snapshot - Data for which to create
 * an ordered array.
 * @return {Object|Null} Object documents from snapshot or null
 */
export function dataByIdSnapshot(snap) {
  const data = {};
  if (snap.data && snap.exists) {
    data[snap.id] = snap.data();
  } else if (snap.forEach) {
    snap.forEach(doc => {
      data[doc.id] = doc.data() || doc;
    });
  }
  return size(data) ? data : null;
}
