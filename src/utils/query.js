import { isObject, isString, isArray, size, trim, forEach } from 'lodash';
import { actionTypes } from '../constants';

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
export const firestoreRef = (firebase, dispatch, meta) => {
  if (!firebase.firestore) {
    throw new Error('Firestore must be required and initalized.');
  }
  const { collection, doc, where } = meta;
  let ref = firebase.firestore().collection(collection);
  if (doc) {
    ref = ref.doc(doc);
  }
  if (where) {
    if (!isArray(where)) {
      throw new Error('where parameter must be an array');
    }
    if (isString(where[0])) {
      ref = where.length > 1 ? ref.where(...where) : ref.where(where[0]);
    } else {
      forEach(where, (whereArgs) => {
        if (!isArray(whereArgs)) {
          throw new Error(
            'Where currently only supports arrays. Each option must be an Array of arguments to pass to where.',
          );
        }
        ref = whereArgs.length > 1 ? ref.where(...whereArgs) : ref.where(whereArgs);
      });
    }
  }
  return ref;
};

const whereToStr = where =>
  isString(where[0]) ? where.join(':') : where.map(whereToStr);

const getQueryName = (meta) => {
  const { collection, doc, where } = meta;
  if (!collection) {
    throw new Error('Collection is required to build query name');
  }
  if (doc) {
    return `${collection}/${doc}`;
  }
  if (where) {
    if (!isArray(where)) {
      throw new Error('Where must be an array');
    }
    return `${collection}/${doc}/${whereToStr(where)}`;
  }
  return collection;
};


/**
 * @description Update the number of watchers for a query
 * @param {Object} firebase - Internal firebase object
 * @param {Function} dispatch - Redux's dispatch function
 * @param {Object} meta - Metadata
 * @param {String} collection - Collection name
 * @param {String} doc - Document name
 * @return {Object} Object containing all listeners
 */
export const attachListener = (firebase, dispatch, meta, unsubscribe) => {
  const name = getQueryName(meta);
  if (!firebase._.listeners[name]) {
    firebase._.listeners[name] = unsubscribe; // eslint-disable-line no-param-reassign
  } else {
    console.warn(`Listener already exists for ${name}`); // eslint-disable-line no-console
  }

  dispatch({
    type: actionTypes.SET_LISTENER,
    meta,
    payload: { name },
  });

  return firebase._.listeners;
};

/**
 * @description Remove/Unset a watcher
 * @param {Object} firebase - Internal firebase object
 * @param {Function} dispatch - Redux's dispatch function
 * @param {Object} meta - Metadata
 * @param {String} collection - Collection name
 * @param {String} doc - Document name
 */
export const detachListener = (firebase, dispatch, meta) => {
  const name = getQueryName(meta);
  if (firebase._.listeners[name]) {
    firebase._.listeners[name]();
    delete firebase._.listeners[name]; // eslint-disable-line no-param-reassign
  } else {
    console.warn(`Listener does not exist for ${name}`); // eslint-disable-line no-console
  }

  dispatch({
    type: actionTypes.UNSET_LISTENER,
    meta,
    payload: { name },
  });
};

/**
 * Turn query string into a query config object
 * @param  {String} queryPathStr String to be converted
 * @return {Object} Object containing collection, doc and subcollection
 */
const queryStrToObj = (queryPathStr) => {
  const pathArr = trim(queryPathStr, ['/']).split('/');
  const [collection, doc, subCollection, ...other] = pathArr;
  return {
    collection,
    doc,
    subCollection,
    other,
  };
};

/**
 * @description Convert array of querys into an array of query config objects
 * @param {Object|String} query - Query setups in the form of objects or strings
 * @return {Object} Query setup normalized into a queryConfig object
 */
export const getQueryConfig = (query) => {
  if (isString(query)) {
    return queryStrToObj(query);
  }
  if (isObject(query)) {
    if (!query.collection && !query.doc) {
      throw new Error('Collection and/or Doc are required parameters within query definition object');
    }
    if (query.subCollections) {
      return {
        ...query,
        subCollections: query.subCollections.map(getQueryConfig),
      };
    }
    return query;
  }
  throw new Error('Invalid Path Definition: Only Strings and Objects are accepted.');
};


/**
 * @description Convert array of querys into an array of queryConfig objects
 * @param {Array} queries - Array of query strings/objects
 * @return {Array} watchEvents - Array of watch events
 */
export const getQueryConfigs = (queries) => {
  if (isArray(queries)) {
    return queries.map(getQueryConfig);
  }
  if (isString(queries)) {
    return queryStrToObj(queries);
  }
  if (isObject(queries)) {
    return [getQueryConfig(queries)];
  }
  throw new Error('Querie(s) must be an Array or a string');
};

/**
 * Get ordered array from snapshot
 * @param  {firebase.database.DataSnapshot} snapshot - Data for which to create
 * an ordered array.
 * @return {Array|Null} Ordered list of children from snapshot or null
 */
export const orderedFromSnap = (snap) => {
  const ordered = [];
  if (snap.data && snap.exists) {
    const obj = isObject(snap.data())
       ? { id: snap.id, ...snap.data() || snap.data }
       : { id: snap.id, data: snap.data() };
    ordered.push(obj);
  } else if (snap.forEach) {
    snap.forEach((doc) => {
      const obj = isObject(doc.data())
         ? { id: doc.id, ...doc.data() || doc.data }
         : { id: doc.id, data: doc.data() };
      ordered.push(obj);
    });
  }
  return ordered;
};

/**
 * Create data object with values for each document with keys being doc.id.
 * @param  {firebase.database.DataSnapshot} snapshot - Data for which to create
 * an ordered array.
 * @return {Object|Null} Object documents from snapshot or null
 */
export const dataByIdSnapshot = (snap) => {
  const data = {};
  if (snap.data && snap.exists) {
    data[snap.id] = snap.data();
  } else if (snap.forEach) {
    snap.forEach((doc) => {
      data[doc.id] = doc.data() || doc;
    });
  }
  return size(data) ? data : null;
};
