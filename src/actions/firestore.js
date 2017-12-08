import { isArray, invoke } from 'lodash';
import { wrapInDispatch } from '../utils/actions';
import { actionTypes } from '../constants';
import {
  attachListener,
  detachListener,
  orderedFromSnap,
  dataByIdSnapshot,
  getQueryConfig,
  firestoreRef,
} from '../utils/query';

/**
 * Add data to a collection or document on Cloud Firestore with the call to
 * the Firebase library being wrapped in action dispatches.
 * @param {Object} firebase - Internal firebase object
 * @param {Function} dispatch - Redux's dispatch function
 * @param {String} collection - Collection name
 * @param {String} doc - Document name
 * @return {Promise} Resolves with results of add call
 */
export const add = (firebase, dispatch, queryOption, ...args) => {
  const meta = getQueryConfig(queryOption);
  return wrapInDispatch(dispatch, {
    ref: firestoreRef(firebase, dispatch, meta),
    method: 'add',
    meta,
    args,
    types: [
      actionTypes.ADD_REQUEST,
      actionTypes.ADD_SUCCESS,
      actionTypes.ADD_FAILURE,
    ],
  });
};

/**
 * Set data to a document on Cloud Firestore with the call to
 * the Firebase library being wrapped in action dispatches.
 * @param {Object} firebase - Internal firebase object
 * @param {Function} dispatch - Redux's dispatch function
 * @param {String} collection - Collection name
 * @param {String} doc - Document name
 * @return {Promise} Resolves with results of set call
 */
export const set = (firebase, dispatch, queryOption, ...args) => {
  const meta = getQueryConfig(queryOption);
  return wrapInDispatch(dispatch, {
    ref: firestoreRef(firebase, dispatch, meta),
    method: 'set',
    meta,
    args,
    types: [
      actionTypes.SET_REQUEST,
      actionTypes.SET_SUCCESS,
      actionTypes.SET_FAILURE,
    ],
  });
};

/**
 * Get a collection or document from Cloud Firestore with the call to
 * the Firebase library being wrapped in action dispatches.
 * @param {Object} firebase - Internal firebase object
 * @param {Function} dispatch - Redux's dispatch function
 * @param {String} collection - Collection name
 * @param {String} doc - Document name
 * @return {Promise} Resolves with results of get call
 */
export const get = (firebase, dispatch, queryOption) => {
  const meta = getQueryConfig(queryOption);
  return wrapInDispatch(dispatch, {
    ref: firestoreRef(firebase, dispatch, meta),
    method: 'get',
    meta,
    types: [
      actionTypes.GET_REQUEST,
      {
        type: actionTypes.GET_SUCCESS,
        payload: (snap) => {
          const ordered = orderedFromSnap(snap);
          const data = dataByIdSnapshot(snap);
          return { data, ordered };
        },
      },
      actionTypes.GET_FAILURE,
    ],
  });
};

/**
 * Update a document on Cloud Firestore with the call to
 * the Firebase library being wrapped in action dispatches.
 * @param {Object} firebase - Internal firebase object
 * @param {Function} dispatch - Redux's dispatch function
 * @param {String} collection - Collection name
 * @param {String} doc - Document name
 * @return {Promise} Resolves with results of update call
 */
export const update = (firebase, dispatch, queryOption, ...args) => {
  const meta = getQueryConfig(queryOption);
  return wrapInDispatch(dispatch, {
    ref: firestoreRef(firebase, dispatch, meta),
    method: 'update',
    meta,
    args,
    types: [
      actionTypes.UPDATE_REQUEST,
      actionTypes.UPDATE_SUCCESS,
      actionTypes.UPDATE_FAILURE,
    ],
  });
};

/**
 * Update a document on Cloud Firestore with the call to
 * the Firebase library being wrapped in action dispatches.
 * @param {Object} firebase - Internal firebase object
 * @param {Function} dispatch - Redux's dispatch function
 * @param {String} collection - Collection name
 * @param {String} doc - Document name
 * @return {Promise} Resolves with results of update call
 */
export const deleteRef = (firebase, dispatch, queryOption) => {
  const meta = getQueryConfig(queryOption);
  if (!meta.doc) {
    throw new Error('Only docs can be deleted');
  }
  return wrapInDispatch(dispatch, {
    ref: firestoreRef(firebase, dispatch, meta),
    method: 'delete',
    meta,
    types: [
      actionTypes.DELETE_REQUEST,
      actionTypes.DELETE_SUCCESS,
      actionTypes.DELETE_FAILURE,
    ],
  });
};

/**
 * Set listener to Cloud Firestore with the call to the Firebase library
 * being wrapped in action dispatches.. Internall calls Firebase's onSnapshot()
 * method.
 * @param {Object} firebase - Internal firebase object
 * @param {Function} dispatch - Redux's dispatch function
 * @param {Object} meta - Metadata
 * @param {String} meta.collection - Collection name
 * @param {String} meta.doc - Document name
 * @param {Array} meta.where - Where settings for query. Array of strings
 * for one where, an Array of Arrays for multiple wheres
 * @param  {Function} successCb - Callback called on success
 * @param  {Function} errorCb - Callback called on error
 */
export const setListener = (firebase, dispatch, queryOpts, successCb, errorCb) => {
  const meta = getQueryConfig(queryOpts);
  const unsubscribe = firestoreRef(firebase, dispatch, meta)
    .onSnapshot((docData) => {
      dispatch({
        type: actionTypes.LISTENER_RESPONSE,
        meta,
        payload: {
          data: dataByIdSnapshot(docData),
          ordered: orderedFromSnap(docData),
        },
      });
      if (successCb) {
        successCb(docData);
      }
    }, (err) => {
      // TODO: Look into whether listener is automatically removed in all cases
      // TODO: Provide a setting that allows for silencing of console error
      // Log error handling the case of it not existing
      invoke(console, 'error', err);
      dispatch({
        type: actionTypes.LISTENER_ERROR,
        meta,
        payload: err,
      });
      if (errorCb) {
        errorCb(err);
      }
    });
  attachListener(firebase, dispatch, meta, unsubscribe);
};

/**
 * Set an array of listeners
 * @param {Object} firebase - Internal firebase object
 * @param {Function} dispatch - Redux's dispatch function
 * @param {Array} listeners
 */
export const setListeners = (firebase, dispatch, listeners) => {
  if (!isArray(listeners)) {
    throw new Error('Listeners must be an Array of listener configs (Strings/Objects)');
  }
  return listeners.map(listener => setListener(firebase, dispatch, listener));
};

/**
 * Unset previously set listener to Cloud Firestore. Listener must have been
 * set with setListener(s) in order to be tracked.
 * @param {Object} firebase - Internal firebase object
 * @param {Function} dispatch - Redux's dispatch function
 * @param {Object} meta - Metadata
 * @param {String} meta.collection - Collection name
 * @param {String} meta.doc - Document name
 * @return {Promise} Resolves when listener has been attached **not** when data
 * has been gathered by the listener.
 */
export const unsetListener = (firebase, dispatch, opts) =>
  detachListener(firebase, dispatch, getQueryConfig(opts));

/**
 * Unset a list of listeners
 * @param {Object} firebase - Internal firebase object
 * @param {Function} dispatch - Redux's dispatch function
 * @param {Array} listeners [description]
 */
export const unsetListeners = (firebase, dispatch, listeners) => {
  if (!isArray(listeners)) {
    throw new Error('Listeners must be an Array of listener configs (Strings/Objects)');
  }
  return listeners.map(listener => unsetListener(firebase, dispatch, listener));
};

export default {
  get,
  firestoreRef,
  add,
  update,
  setListener,
  setListeners,
  unsetListener,
  unsetListeners,
};
