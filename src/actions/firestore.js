import { every } from 'lodash';
import { wrapInDispatch } from '../utils/actions';
import { actionTypes } from '../constants';
import {
  attachListener,
  dataByIdSnapshot,
  detachListener,
  dispatchListenerResponse,
  firestoreRef,
  getPopulateActions,
  getQueryConfig,
  getQueryName,
  orderedFromSnap,
  snapshotCache,
} from '../utils/query';

/**
 * Add data to a collection or document on Cloud Firestore with the call to
 * the Firebase library being wrapped in action dispatches.
 * @param {object} firebase - Internal firebase object
 * @param {Function} dispatch - Redux's dispatch function
 * @param {string} queryOption - Options for query
 * @param {...any} args - Any preceding arguments
 * @returns {Promise} Resolves with results of add call
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
        payload: (snap) => {
          const obj = { id: snap.id, data: args[0] };
          snapshotCache.set(obj, snap);
          return obj;
        },
      },
      actionTypes.ADD_FAILURE,
    ],
  });
}

/**
 * Set data to a document on Cloud Firestore with the call to
 * the Firebase library being wrapped in action dispatches.
 * @param {object} firebase - Internal firebase object
 * @param {Function} dispatch - Redux's dispatch function
 * @param {string} queryOption - Options for query
 * @param {...any} args - Any preceding arguments
 * @returns {Promise} Resolves with results of set call
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
 * @param {object} firebase - Internal firebase object
 * @param {Function} dispatch - Redux's dispatch function
 * @param {string} queryOption - Options for query
 * @returns {Promise} Resolves with results of get call
 */
export function get(firebase, dispatch, queryOption) {
  const meta = getQueryConfig(queryOption);
  // Wrap get call in dispatch calls
  const {
    mergeOrdered,
    mergeOrderedDocUpdates,
    mergeOrderedCollectionUpdates,
  } = firebase._.config || {};
  return wrapInDispatch(dispatch, {
    ref: firestoreRef(firebase, meta),
    method: 'get',
    meta,
    types: [
      actionTypes.GET_REQUEST,
      {
        type: actionTypes.GET_SUCCESS,
        payload: (snap) => ({
          data: dataByIdSnapshot(snap),
          ordered: orderedFromSnap(snap),
          fromCache:
            typeof snap.metadata?.fromCache === 'boolean'
              ? snap.metadata.fromCache
              : true,
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
 * @param {object} firebase - Internal firebase object
 * @param {Function} dispatch - Redux's dispatch function
 * @param {string} queryOption - Options for query
 * @param {...any} args - Any preceding arguments
 * @returns {Promise} Resolves with results of update call
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
 * @param {object} firebase - Internal firebase object
 * @param {Function} dispatch - Redux's dispatch function
 * @param {string} queryOption - Options for query
 * @returns {Promise} Resolves with results of update call
 */
export function deleteRef(firebase, dispatch, queryOption) {
  const meta = getQueryConfig(queryOption);
  const { config } = firebase._;
  if (
    !meta.doc ||
    (meta.subcollections && !every(meta.subcollections, 'doc'))
  ) {
    if (typeof config.onAttemptCollectionDelete === 'function') {
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
 * @param {object} firebase - Internal firebase object
 * @param {Function} dispatch - Redux's dispatch function
 * @param {string} queryOpts - Options for query
 * @param {string} queryOpts.collection - Collection name
 * @param {string} queryOpts.doc - Document name
 * @param {Array} queryOpts.where - Where settings for query. Array of strings
 * for one where, an Array of Arrays for multiple wheres
 * @param  {Function} successCb - Callback called on success
 * @param  {Function} errorCb - Callback called on error
 * @returns {Function} Unsubscribe
 */
export function setListener(firebase, dispatch, queryOpts, successCb, errorCb) {
  const meta = getQueryConfig(queryOpts);

  // Create listener
  const success = (docData) => {
    // Dispatch directly if no populates
    if (!meta.populates) {
      dispatchListenerResponse({ dispatch, docData, meta, firebase });
      // Invoke success callback if it exists
      if (typeof successCb === 'function') successCb(docData);
      return Promise.resolve();
    }

    return getPopulateActions({ firebase, docData, meta })
      .then((populateActions) => {
        // Dispatch each populate action
        populateActions.forEach((populateAction) => {
          dispatch({
            ...populateAction,
            type: actionTypes.LISTENER_RESPONSE,
            timestamp: Date.now(),
          });
        });
        // Dispatch original action
        dispatchListenerResponse({ dispatch, docData, meta, firebase });
      })
      .catch((populateErr) => {
        const { logListenerError } = firebase._.config || {};
        // Handle errors in population
        if (logListenerError !== false) {
          // Log error handling the case of it not existing
          if (
            logListenerError !== false &&
            !!console &&
            typeof console.error === 'function' // eslint-disable-line no-console
          ) {
            console.error('redux-firestore error populating:', populateErr); // eslint-disable-line no-console
          }
        }
        if (typeof errorCb === 'function') errorCb(populateErr);
      });
  };

  const error = (err) => {
    const {
      mergeOrdered,
      mergeOrderedDocUpdates,
      mergeOrderedCollectionUpdates,
      logListenerError,
      preserveOnListenerError,
    } = firebase._.config || {};
    // TODO: Look into whether listener is automatically removed in all cases
    // Log error handling the case of it not existing
    if (
      logListenerError !== false &&
      !!console &&
      typeof console.error === 'function' // eslint-disable-line no-console
    ) {
      console.error('redux-firestore listener error:', err); // eslint-disable-line no-console
    }
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
  };

  const includeMetadataChanges =
    (queryOpts && queryOpts.includeMetadataChanges) || false;

  // Create listener
  const unsubscribe = includeMetadataChanges
    ? firestoreRef(firebase, meta).onSnapshot(
        { includeMetadataChanges },
        success,
        error,
      )
    : firestoreRef(firebase, meta).onSnapshot(success, error);
  attachListener(firebase, dispatch, meta, unsubscribe);

  return unsubscribe;
}

/**
 * Set an array of listeners only allowing for one of a specific configuration.
 * If config.allowMultipleListeners is true or a function
 * (`(listener, listeners) => {}`) that evaluates to true then multiple
 * listeners with the same config are attached.
 * @param {object} firebase - Internal firebase object
 * @param {Function} dispatch - Redux's dispatch function
 * @param {Array} listeners - Listener settings array
 */
export function setListeners(firebase, dispatch, listeners) {
  if (!Array.isArray(listeners)) {
    throw new Error(
      'Listeners must be an Array of listener configs (Strings/Objects).',
    );
  }

  const { config } = firebase._;

  // Only attach one listener (count of matching listener path calls is tracked)
  if (config.oneListenerPerPath) {
    listeners.forEach((listener) => {
      const path = getQueryName(listener);
      const oldListenerCount = firebase._.pathListenerCounts[path] || 0;
      // eslint-disable-next-line no-param-reassign
      firebase._.pathListenerCounts[path] = oldListenerCount + 1;

      // If we already have an attached listener exit here
      if (oldListenerCount > 0) {
        return;
      }

      setListener(firebase, dispatch, listener);
    });
  } else {
    const { allowMultipleListeners } = config;

    listeners.forEach((listener) => {
      const path = getQueryName(listener);
      const oldListenerCount = firebase._.pathListenerCounts[path] || 0;
      const multipleListenersEnabled =
        typeof allowMultipleListeners === 'function'
          ? allowMultipleListeners(listener, firebase._.listeners)
          : allowMultipleListeners;

      // eslint-disable-next-line no-param-reassign
      firebase._.pathListenerCounts[path] = oldListenerCount + 1;

      // If we already have an attached listener exit here
      if (oldListenerCount === 0 || multipleListenersEnabled) {
        setListener(firebase, dispatch, listener);
      }
    });
  }
}

/**
 * Unset previously set listener to Cloud Firestore. Listener must have been
 * set with setListener(s) in order to be tracked.
 * @param {object} firebase - Internal firebase object
 * @param {Function} dispatch - Redux's dispatch function
 * @param {object} meta - Metadata
 * @param {string} meta.collection - Collection name
 * @param {string} meta.doc - Document name
 * @returns {Promise} Resolves when listener has been attached **not** when data
 * has been gathered by the listener.
 */
export function unsetListener(firebase, dispatch, meta) {
  return detachListener(firebase, dispatch, getQueryConfig(meta));
}

/**
 * Unset a list of listeners
 * @param {object} firebase - Internal firebase object
 * @param {Function} dispatch - Redux's dispatch function
 * @param {Array} listeners - Array of listener configs
 */
export function unsetListeners(firebase, dispatch, listeners) {
  if (!Array.isArray(listeners)) {
    throw new Error(
      'Listeners must be an Array of listener configs (Strings/Objects).',
    );
  }
  const { config } = firebase._;
  const { allowMultipleListeners } = config;

  // Keep one listener path even when detaching
  listeners.forEach((listener) => {
    const path = getQueryName(listener);
    const listenerExists = firebase._.pathListenerCounts[path] >= 1;
    const multipleListenersEnabled =
      typeof allowMultipleListeners === 'function'
        ? allowMultipleListeners(listener, firebase._.listeners)
        : allowMultipleListeners;

    if (listenerExists) {
      // eslint-disable-next-line no-param-reassign
      firebase._.pathListenerCounts[path] -= 1;
      // If we aren't supposed to have listners for this path, then remove them
      if (
        firebase._.pathListenerCounts[path] === 0 ||
        multipleListenersEnabled
      ) {
        unsetListener(firebase, dispatch, listener);
      }
    }
  });
}

/**
 * Atomic operation with Firestore (either read or write).
 * @param {object} firebase - Internal firebase object
 * @param {Function} dispatch - Redux's dispatch function
 * @param {Function} transactionPromise - Function which runs transaction
 * operation.
 * @returns {Promise} Resolves with result of transaction operation
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

/**
 * Unified solo, batch & transactions operations.
 * @param {object} firebase - Internal firebase object
 * @param {Function} dispatch - Redux's dispatch function
 * @param {string} mutations - Mutations for query
 * @returns {Promise} Resolves with results of update call
 */
export function mutate(firebase, dispatch, mutations) {
  const timestamp = `${+new Date()}`;

  return wrapInDispatch(dispatch, {
    ref: firebase,
    method: 'mutate',
    meta: { timestamp },
    args: [mutations],
    types: [
      {
        type: actionTypes.MUTATE_START,
        payload: { data: mutations },
      },
      actionTypes.MUTATE_SUCCESS,
      {
        type: actionTypes.MUTATE_FAILURE,
        meta: { timestamp },
        payload: { data: mutations },
      },
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
  mutate,
};
