import { isArray, invoke, isFunction, every } from 'lodash';
import { wrapInDispatch } from '../utils/actions';
import { actionTypes } from '../constants';
import {
  attachListener,
  detachListener,
  orderedFromSnap,
  dataByIdSnapshot,
  getQueryConfig,
  getQueryName,
  firestoreRef,
  dispatchListenerResponse,
  getPopulateActions,
} from '../utils/query';

const pathListenerCounts = {};

/**
 * Add data to a collection or document on Cloud Firestore with the call to
 * the Firebase library being wrapped in action dispatches.
 * @param {Object} firebase - Internal firebase object
 * @param {Function} dispatch - Redux's dispatch function
 * @param {String} collection - Collection name
 * @param {String} doc - Document name
 * @return {Promise} Resolves with results of add call
 */
export function add(firebase, dispatch, queryOption, ...args) {
  const meta = getQueryConfig(queryOption);
  return wrapInDispatch(dispatch, {
    ref: firestoreRef(firebase, meta),
    method: 'add',
    meta,
    args,
    types: [
      actionTypes.ADD_REQUEST,
      {
        type: actionTypes.ADD_SUCCESS,
        payload: snap => ({ id: snap.id, data: args[0] }),
      },
      actionTypes.ADD_FAILURE,
    ],
  });
}

/**
 * Set data to a document on Cloud Firestore with the call to
 * the Firebase library being wrapped in action dispatches.
 * @param {Object} firebase - Internal firebase object
 * @param {Function} dispatch - Redux's dispatch function
 * @param {String} collection - Collection name
 * @param {String} doc - Document name
 * @return {Promise} Resolves with results of set call
 */
export function set(firebase, dispatch, queryOption, ...args) {
  const meta = getQueryConfig(queryOption);
  return wrapInDispatch(dispatch, {
    ref: firestoreRef(firebase, meta),
    method: 'set',
    meta,
    args,
    types: [
      actionTypes.SET_REQUEST,
      actionTypes.SET_SUCCESS,
      actionTypes.SET_FAILURE,
    ],
  });
}

/**
 * Get a collection or document from Cloud Firestore with the call to
 * the Firebase library being wrapped in action dispatches.
 * @param {Object} firebase - Internal firebase object
 * @param {Function} dispatch - Redux's dispatch function
 * @param {String} collection - Collection name
 * @param {String} doc - Document name
 * @return {Promise} Resolves with results of get call
 */
export function get(firebase, dispatch, queryOption) {
  const meta = getQueryConfig(queryOption);
  // Wrap get call in dispatch calls
  const {
    mergeOrdered,
    mergeOrderedDocUpdates,
    mergeOrderedCollectionUpdates,
  } =
    firebase._.config || {};
  return wrapInDispatch(dispatch, {
    ref: firestoreRef(firebase, meta),
    method: 'get',
    meta,
    types: [
      actionTypes.GET_REQUEST,
      {
        type: actionTypes.GET_SUCCESS,
        payload: snap => ({
          data: dataByIdSnapshot(snap),
          ordered: orderedFromSnap(snap),
        }),
        merge: {
          docs: mergeOrdered && mergeOrderedDocUpdates,
          collections: mergeOrdered && mergeOrderedCollectionUpdates,
        },
      },
      actionTypes.GET_FAILURE,
    ],
  });
}

/**
 * Update a document on Cloud Firestore with the call to the Firebase library
 * being wrapped in action dispatches.
 * @param {Object} firebase - Internal firebase object
 * @param {Function} dispatch - Redux's dispatch function
 * @param {String} collection - Collection name
 * @param {String} doc - Document name
 * @return {Promise} Resolves with results of update call
 */
export function update(firebase, dispatch, queryOption, ...args) {
  const meta = getQueryConfig(queryOption);
  return wrapInDispatch(dispatch, {
    ref: firestoreRef(firebase, meta),
    method: 'update',
    meta,
    args,
    types: [
      actionTypes.UPDATE_REQUEST,
      actionTypes.UPDATE_SUCCESS,
      actionTypes.UPDATE_FAILURE,
    ],
  });
}

/**
 * Delete a reference on Cloud Firestore with the call to the Firebase library
 * being wrapped in action dispatches. If attempting to delete a collection
 * delete promise will be rejected with "Only documents can be deleted" unless
 * onAttemptCollectionDelete is provided. This is due to the fact that
 * Collections can not be deleted from a client, it should instead be handled
 * within a cloud function.
 * @param {Object} firebase - Internal firebase object
 * @param {Function} dispatch - Redux's dispatch function
 * @param {String} collection - Collection name
 * @param {String} doc - Document name
 * @return {Promise} Resolves with results of update call
 */
export function deleteRef(firebase, dispatch, queryOption) {
  const meta = getQueryConfig(queryOption);
  const { config } = firebase._;
  if (
    !meta.doc ||
    (meta.subcollections && !every(meta.subcollections, 'doc'))
  ) {
    if (isFunction(config.onAttemptCollectionDelete)) {
      return config.onAttemptCollectionDelete(queryOption, dispatch, firebase);
    }
    return Promise.reject(new Error('Only documents can be deleted.'));
  }
  return wrapInDispatch(dispatch, {
    ref: firestoreRef(firebase, meta),
    method: 'delete',
    meta,
    types: [
      actionTypes.DELETE_REQUEST,
      {
        type: actionTypes.DELETE_SUCCESS,
        preserve: firebase._.config.preserveOnDelete,
      },
      actionTypes.DELETE_FAILURE,
    ],
  });
}

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
export function setListener(firebase, dispatch, queryOpts, successCb, errorCb) {
  const meta = getQueryConfig(queryOpts);

  // Create listener
  const unsubscribe = firestoreRef(firebase, meta).onSnapshot(
    docData => {
      // Dispatch directly if no populates
      if (!meta.populates) {
        dispatchListenerResponse({ dispatch, docData, meta, firebase });
        // Invoke success callback if it exists
        if (typeof successCb === 'function') successCb(docData);
        return;
      }

      getPopulateActions({ firebase, docData, meta })
        .then(populateActions => {
          // Dispatch each populate action
          populateActions.forEach(populateAction => {
            dispatch({
              ...populateAction,
              type: actionTypes.LISTENER_RESPONSE,
              timestamp: Date.now(),
            });
          });
          // Dispatch original action
          dispatchListenerResponse({ dispatch, docData, meta, firebase });
        })
        .catch(populateErr => {
          // Handle errors in population
          if (firebase._.config.logListenerError) {
            // Log error handling the case of it not existing
            invoke(console, 'error', `Error populating:`, populateErr);
          }
          if (typeof errorCb === 'function') errorCb(populateErr);
        });
    },
    err => {
      const {
        mergeOrdered,
        mergeOrderedDocUpdates,
        mergeOrderedCollectionUpdates,
      } =
        firebase._.config || {};
      // TODO: Look into whether listener is automatically removed in all cases
      // Log error handling the case of it not existing
      const { logListenerError, preserveOnListenerError } =
        firebase._.config || {};
      if (logListenerError) invoke(console, 'error', err);
      dispatch({
        type: actionTypes.LISTENER_ERROR,
        meta,
        payload: err,
        merge: {
          docs: mergeOrdered && mergeOrderedDocUpdates,
          collections: mergeOrdered && mergeOrderedCollectionUpdates,
        },
        preserve: preserveOnListenerError,
      });
      // Invoke error callback if it exists
      if (typeof errorCb === 'function') errorCb(err);
    },
  );
  attachListener(firebase, dispatch, meta, unsubscribe);

  return unsubscribe;
}

/**
 * Set an array of listeners only allowing for one of a specific configuration.
 * If config.allowMultipleListeners is true or a function
 * (`(listener, listeners) => {}`) that evaluates to true then multiple
 * listeners with the same config are attached.
 * @param {Object} firebase - Internal firebase object
 * @param {Function} dispatch - Redux's dispatch function
 * @param {Array} listeners
 */
export function setListeners(firebase, dispatch, listeners) {
  if (!isArray(listeners)) {
    throw new Error(
      'Listeners must be an Array of listener configs (Strings/Objects).',
    );
  }

  const { config } = firebase._;
  const { allowMultipleListeners } = config;

  return listeners.forEach(listener => {
    const path = getQueryName(listener);
    const oldListenerCount = pathListenerCounts[path] || 0;
    const multipleListenersEnabled = isFunction(allowMultipleListeners)
      ? allowMultipleListeners(listener, firebase._.listeners)
      : allowMultipleListeners;

    pathListenerCounts[path] = oldListenerCount + 1;

    // If we already have an attached listener exit here
    if (oldListenerCount === 0 || multipleListenersEnabled) {
      setListener(firebase, dispatch, listener);
    }
  });
}

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
export function unsetListener(firebase, dispatch, opts) {
  return detachListener(firebase, dispatch, getQueryConfig(opts));
}

/**
 * Unset a list of listeners
 * @param {Object} firebase - Internal firebase object
 * @param {Function} dispatch - Redux's dispatch function
 * @param {Array} listeners - Array of listener configs
 */
export function unsetListeners(firebase, dispatch, listeners) {
  if (!isArray(listeners)) {
    throw new Error(
      'Listeners must be an Array of listener configs (Strings/Objects).',
    );
  }
  const { config } = firebase._;
  const { allowMultipleListeners } = config;

  // Keep one listener path even when detaching
  listeners.forEach(listener => {
    const path = getQueryName(listener);
    const listenerExists = pathListenerCounts[path] >= 1;
    const multipleListenersEnabled = isFunction(allowMultipleListeners)
      ? allowMultipleListeners(listener, firebase._.listeners)
      : allowMultipleListeners;

    if (listenerExists) {
      pathListenerCounts[path] -= 1;
      // If we aren't supposed to have listners for this path, then remove them
      if (pathListenerCounts[path] === 0 || multipleListenersEnabled) {
        unsetListener(firebase, dispatch, listener);
      }
    }
  });
}

/**
 * Atomic operation with Firestore (either read or write).
 * @param {Object} firebase - Internal firebase object
 * @param {Function} dispatch - Redux's dispatch function
 * @param  {Function} transactionPromise - Function which runs transaction
 * operation.
 * @return {Promise} Resolves with result of transaction operation
 */
export function runTransaction(firebase, dispatch, transactionPromise) {
  return wrapInDispatch(dispatch, {
    ref: firebase.firestore(),
    method: 'runTransaction',
    args: [transactionPromise],
    types: [
      actionTypes.TRANSACTION_START,
      actionTypes.TRANSACTION_SUCCESS,
      actionTypes.TRANSACTION_FAILURE,
    ],
  });
}

export default {
  get,
  firestoreRef,
  add,
  update,
  setListener,
  setListeners,
  unsetListener,
  unsetListeners,
  runTransaction,
};
