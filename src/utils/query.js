import { isObject, isString, isArray, size } from 'lodash';
import { actionTypes } from '../constants';

/**
 * Create a Cloud Firestore reference for a collection or document
 * @param {Object} firebase - Internal firebase object
 * @param {Function} dispatch - Redux's dispatch function
 * @param {Object} meta - Metadata
 * @param {String} meta.collection - Collection name
 * @param {String} meta.doc - Document name
 * @return {firebase.firestore.Reference} Resolves with results of add call
 */
export const firestoreRef = (firebase, dispatch, { collection, doc }) => {
  if (!firebase.firestore) {
    throw new Error('Firestore must be required and initalized.');
  }
  const ref = firebase.firestore().collection(collection);
  return doc ? ref.doc(doc) : ref;
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
export const attachListener = (firebase, dispatch, { collection, doc }, unsubscribe) => {
  const name = doc ? `${collection}/${doc}` : collection;
  if (!firebase._.listeners[name]) {
    firebase._.listeners[name] = unsubscribe; // eslint-disable-line no-param-reassign
  } else {
    console.warn(`Listener already exists for ${name}`); // eslint-disable-line no-console
  }

  dispatch({
    type: actionTypes.SET_LISTENER,
    meta: { collection, doc },
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
export const detachListener = (firebase, dispatch, { collection, doc }) => {
  const name = doc ? `${collection}/${doc}` : collection;
  if (firebase._.listeners[name]) {
    firebase._.listeners[name]();
  } else {
    console.warn(`Listener does not exist for ${name}`); // eslint-disable-line no-console
  }

  dispatch({
    type: actionTypes.UNSET_LISTENER,
    meta: { collection, doc },
    payload: { name },
  });
};

/**
 * Turn query string into a query config object
 * @param  {String} queryPathStr String to be converted
 * @return {Object} Object containing collection, doc and subcollection
 */
const queryStrToObj = (queryPathStr) => {
  const [collection, doc, subCollection, ...other] = queryPathStr.split('/');
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
  if (snap.forEach) {
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
  if (snap.forEach) {
    snap.forEach((doc) => {
      data[doc.id] = doc.data() || doc;
    });
  }
  return size(data) ? data : null;
};
