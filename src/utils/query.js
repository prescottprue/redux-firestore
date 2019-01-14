import {
  isString,
  isArray,
  isFunction,
  isObject,
  size,
  trim,
  forEach,
  has,
  map,
  get,
  set,
  some,
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
export function firestoreRef(firebase, meta) {
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
 * Create query name based on query settings for use as object keys (used
 * in listener management and reducers).
 * @param  {Object} meta - Metadata object containing query settings
 * @param  {String} meta.collection - Collection name of query
 * @param  {String} meta.doc - Document id of query
 * @param  {Array} meta.subcollections - Subcollections of query
 * @return {String} String representing query settings
 */
export function getBaseQueryName(meta) {
  if (isString(meta)) {
    return meta;
  }
  const { collection, subcollections, where, limit } = meta;
  if (!collection) {
    throw new Error('Collection is required to build query name');
  }
  let basePath = collection;

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

/**
 * @private
 * @description Create an array of promises for population of an object or list
 * @param {Object} firebase - Internal firebase object
 * @param {Object} populate - Object containing root to be populate
 * @param {Object} populate.root - Firebase root path from which to load populate item
 * @param {String} id - String id
 */
export function getPopulateChild(firebase, populate, id) {
  return firestoreRef(firebase, { collection: populate.root, doc: id })
    .get()
    .then(snap => Object.assign({ id }, snap.data()));
}

/**
 * @private
 * @description Populate list of data
 * @param {Object} firebase - Internal firebase object
 * @param {Object} originalObj - Object to have parameter populated
 * @param {Object} populate - Object containing populate information
 * @param {Object} results - Object containing results of population from other populates
 */
export function populateList(firebase, list, p, results) {
  // Handle root not being defined
  if (!results[p.root]) {
    set(results, p.root, {});
  }
  return Promise.all(
    map(list, (id, childKey) => {
      // handle list of keys
      const populateKey = id === true || p.populateByKey ? childKey : id;
      return getPopulateChild(firebase, p, populateKey).then(pc => {
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
 * @private
 * @description Create standardized populate object from strings or objects
 * @param {String|Object} str - String or Object to standardize into populate object
 */
function getPopulateObj(str) {
  if (!isString(str)) {
    return str;
  }
  const strArray = str.split(':');
  // TODO: Handle childParam
  return { child: strArray[0], root: strArray[1] };
}

/**
 * @private
 * @description Create standardized populate object from strings or objects
 * @param {String|Object} str - String or Object to standardize into populate object
 */
function getPopulateObjs(arr) {
  if (!isArray(arr)) {
    return arr;
  }
  return arr.map(o => (isObject(o) ? o : getPopulateObj(o)));
}

/**
 * @private
 * @description Create an array of promises for population of an object or list
 * @param {Object} firebase - Internal firebase object
 * @param {Object} originalObj - Object to have parameter populated
 * @param {Object} populateString - String containg population data
 */
export function promisesForPopulate(
  firebase,
  dataKey,
  originalData,
  populatesIn,
) {
  // TODO: Handle selecting of parameter to populate with (i.e. displayName of users/user)
  const promisesArray = [];
  const results = {};

  // test if data is a single object, try generating populates and looking for the child
  const populatesForData = getPopulateObjs(
    isFunction(populatesIn) ? populatesIn(dataKey, originalData) : populatesIn,
  );

  const dataHasPopulateChilds = some(populatesForData, populate =>
    has(originalData, populate.child),
  );
  if (dataHasPopulateChilds) {
    // Data is a single object, resolve populates directly
    forEach(populatesForData, p => {
      if (isString(get(originalData, p.child))) {
        return promisesArray.push(
          getPopulateChild(firebase, p, get(originalData, p.child)).then(v => {
            // write child to result object under root name if it is found
            if (v) {
              set(results, `${p.root}.${get(originalData, p.child)}`, v);
            }
          }),
        );
      }

      // Single Parameter is list
      return promisesArray.push(
        populateList(firebase, get(originalData, p.child), p, results),
      );
    });
  } else {
    // Data is a list of objects, each value has parameters to be populated
    // { '1': {someobject}, '2': {someobject} }
    forEach(originalData, (d, key) => {
      // generate populates for this data item if a fn was passed
      const populatesForDataItem = getPopulateObj(
        isFunction(populatesIn) ? populatesIn(key, d) : populatesIn,
      );

      // resolve each populate for this data item
      forEach(populatesForDataItem, p => {
        // get value of parameter to be populated (key or list of keys)
        const idOrList = get(d, p.child);

        // Parameter/child of list item does not exist
        if (!idOrList) {
          return;
        }

        // Parameter of each list item is single ID
        if (isString(idOrList)) {
          return promisesArray.push( // eslint-disable-line
            getPopulateChild(firebase, p, idOrList).then(v => {
              // write child to result object under root name if it is found
              if (v) {
                set(results, `${p.root}.${idOrList}`, v);
              }
              return results;
            }),
          );
        }

        // Parameter of each list item is a list of ids
        if (isArray(idOrList) || isObject(idOrList)) {
          // Create single promise that includes a promise for each child
          return promisesArray.push( // eslint-disable-line
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
 * @param  {Object} change - Document change object from Firebase callback
 * @param  {Object} [originalMeta={}] - Original meta data of action
 * @return {Object}                   [description]
 */
function docChangeEvent(change, originalMeta = {}) {
  const meta = { ...originalMeta, path: change.doc.ref.path };
  if (originalMeta.subcollections && !originalMeta.storeAs) {
    meta.subcollections[0] = { ...meta.subcollections[0], doc: change.doc.id };
  } else {
    meta.doc = change.doc.id;
  }
  return {
    type: changeTypeToEventType[change.type] || actionTypes.DOCUMENT_MODIFIED,
    meta,
    payload: {
      data: change.doc.data(),
      ordered: { oldIndex: change.oldIndex, newIndex: change.newIndex },
    },
  };
}

/**
 * Dispatch action(s) response from listener response.
 * @private
 * @param {Object} opts
 * @param {Function} opts.dispatch - Redux action dispatch function
 * @param {Object} opts.firebase - Firebase instance
 * @param {Object} opts.docData - Data object from document
 * @param {Object} opts.meta - Meta data
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
  } =
    firebase._.config || {};
  const docChanges =
    typeof docData.docChanges === 'function'
      ? docData.docChanges()
      : docData.docChanges;
  // Dispatch different actions for doc changes (only update doc(s) by key)
  if (docChanges && docChanges.length < docData.size) {
    // Loop to dispatch for each change if there are multiple
    // TODO: Option for dispatching multiple changes in single action
    docChanges.forEach(change => {
      dispatch(docChangeEvent(change, meta));
    });
  } else {
    // Dispatch action for whole collection change
    dispatch({
      type: actionTypes.LISTENER_RESPONSE,
      meta,
      payload: {
        data: dataByIdSnapshot(docData),
        ordered: orderedFromSnap(docData),
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
 * @param {Object} opts
 * @param {Object} opts.firebase - Firebase instance
 * @param {Object} opts.docData - Data object from document
 * @param {Object} opts.meta - Meta data
 * @return {Promise}
 */
export function getPopulateActions({ firebase, docData, meta }) {
  // Run promises for population
  return promisesForPopulate(
    firebase,
    docData.id,
    dataByIdSnapshot(docData),
    meta.populates,
  )
    .then(populateResults =>
      // Listener results for each child collection
      Object.keys(populateResults).map(resultKey => ({
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
    .catch(populateErr => {
      console.error('Error with populate:', populateErr, meta); // eslint-disable-line no-console
      return Promise.reject(populateErr);
    });
}
