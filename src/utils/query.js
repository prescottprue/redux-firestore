import { isObject, size } from 'lodash';
import { actionTypes } from '../constants';

/**
 * @private
 * @description Update the number of watchers for a query
 * @param {Object} firebase - Internal firebase object
 * @param {Function} dispatch - Redux's dispatch function
 * @param {Object} meta - Metadata
 * @param {String} collection - Collection name
 * @param {String} doc - Document name
 * @return {Object} Object containing all listeners
 */
export const setListener = (firebase, dispatch, { collection, doc }, unsubscribe) => {
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
 * @private
 * @description Remove/Unset a watcher
 * @param {Object} firebase - Internal firebase object
 * @param {Function} dispatch - Redux's dispatch function
 * @param {Object} meta - Metadata
 * @param {String} collection - Collection name
 * @param {String} doc - Document name
 */
export const unsetListener = (firebase, dispatch, { collection, doc }) => {
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
