import { isArray } from 'lodash';
import { wrapInDispatch } from '../utils/actions';
import { actionTypes } from '../constants';
import {
  attachListener,
  detachListener,
  orderedFromSnap,
  dataByIdSnapshot,
  getQueryConfigs,
  firestoreRef,
} from '../utils/query';


/**
 * Add data to a collection or document on Cloud Firestore.
 * @param {Object} firebase - Internal firebase object
 * @param {Function} dispatch - Redux's dispatch function
 * @param {String} collection - Collection name
 * @param {String} doc - Document name
 * @return {Promise} Resolves with results of add call
 */
export const add = (firebase, dispatch, collection, doc, ...args) =>
  wrapInDispatch(dispatch, {
    ref: firestoreRef(firebase, dispatch, { collection, doc }),
    method: 'add',
    collection,
    doc,
    args,
    types: [
      actionTypes.ADD_REQUEST,
      actionTypes.ADD_SUCCESS,
      actionTypes.ADD_FAILURE,
    ],
  });

/**
 * Set data to a document on Cloud Firestore.
 * @param {Object} firebase - Internal firebase object
 * @param {Function} dispatch - Redux's dispatch function
 * @param {String} collection - Collection name
 * @param {String} doc - Document name
 * @return {Promise} Resolves with results of set call
 */
export const set = (firebase, dispatch, collection, doc, ...args) =>
  wrapInDispatch(dispatch, {
    ref: firestoreRef(firebase, dispatch, { collection, doc }),
    method: 'set',
    args,
    types: [
      actionTypes.SET_REQUEST,
      actionTypes.SET_SUCCESS,
      actionTypes.SET_FAILURE,
    ],
  });

/**
 * Get a collection or document from Cloud Firestore
 * @param {Object} firebase - Internal firebase object
 * @param {Function} dispatch - Redux's dispatch function
 * @param {String} collection - Collection name
 * @param {String} doc - Document name
 * @return {Promise} Resolves with results of get call
 */
export const get = (firebase, dispatch, collection, doc) =>
  wrapInDispatch(dispatch, {
    ref: firestoreRef(firebase, dispatch, { collection, doc }),
    method: 'get',
    collection,
    doc,
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

/**
 * Update a document on Cloud Firestore
 * @param {Object} firebase - Internal firebase object
 * @param {Function} dispatch - Redux's dispatch function
 * @param {String} collection - Collection name
 * @param {String} doc - Document name
 * @return {Promise} Resolves with results of update call
 */
export const update = (firebase, dispatch, collection, doc, ...args) =>
  wrapInDispatch(dispatch, {
    ref: firestoreRef(firebase, dispatch, { collection, doc }),
    method: 'update',
    collection,
    doc,
    args,
    types: [
      actionTypes.UPDATE_REQUEST,
      actionTypes.UPDATE_SUCCESS,
      actionTypes.UPDATE_FAILURE,
    ],
  });

/**
 * Set listener to Cloud Firestore. Internall calls Firebase's onSnapshot()
 * method.
 * @param {Object} firebase - Internal firebase object
 * @param {Function} dispatch - Redux's dispatch function
 * @param {Object} meta - Metadata
 * @param {String} meta.collection - Collection name
 * @param {String} meta.doc - Document name
 * @param  {Function} successCb - Callback called on success
 * @param  {Function} errorCb - Callback called on error
 */
export const onSnapshot = (firebase, dispatch, { collection, doc }, successCb, errorCb) => {
  const query = firebase.firestore().collection(collection);
  const unsubscribe = doc ? query.doc(doc) : query
    .onSnapshot((docData) => {
      dispatch({
        type: actionTypes.LISTENER_RESPONSE,
        meta: { collection, doc },
        payload: {
          data: dataByIdSnapshot(docData),
          ordered: orderedFromSnap(docData),
        },
      });
      if (successCb) {
        successCb(docData);
      }
    }, (err) => {
      // TODO: Look into whether unsubscribe should automatically be called or not
      dispatch({
        type: actionTypes.ON_SNAPSHOT_ERROR,
        meta: { collection, doc },
        payload: err,
      });
      if (errorCb) {
        errorCb(err);
      }
    });
  attachListener(firebase, dispatch, { collection, doc }, unsubscribe);
};

/**
 * Set listener to Cloud Firestore. Internall calls Firebase's onSnapshot()
 * method.
 * @param {Object} firebase - Internal firebase object
 * @param {Function} dispatch - Redux's dispatch function
 * @param {Object} meta - Metadata
 * @param {String} meta.collection - Collection name
 * @param {String} meta.doc - Document name
 * @return {Promise} Resolves when listener has been attached **not** when data
 * has been gathered by the listener.
 */
export const setListener = (firebase, dispatch, queryOpts) => {
  const {
    collection,
    doc,
    // subCollection,
    // other,
  } = getQueryConfigs(queryOpts);
  const unsubscribe = firestoreRef(firebase, dispatch, { collection, doc })
    .onSnapshot((docData) => {
      dispatch({
        type: actionTypes.LISTENER_RESPONSE,
        meta: { collection, doc },
        payload: {
          data: dataByIdSnapshot(docData),
          ordered: orderedFromSnap(docData),
        },
      });
    }, (err) => {
      // TODO: Look into whether listener is automatically removed in all cases
      dispatch({
        type: actionTypes.ON_SNAPSHOT_ERROR,
        meta: { collection, doc },
        payload: err,
      });
    });
  attachListener(firebase, dispatch, { collection, doc }, unsubscribe);
};

/**
 * [setListeners description]
 * @param {Object} firebase - Internal firebase object
 * @param {Function} dispatch - Redux's dispatch function
 * @param {[type]} listeners [description]
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
  detachListener(firebase, dispatch, getQueryConfigs(opts));

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
  onSnapshot,
  setListener,
  setListeners,
  unsetListener,
  unsetListeners,
};
