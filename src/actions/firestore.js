import { isArray, invoke, isFunction, every } from 'lodash';
import { wrapInDispatch } from '../utils/actions';
import { actionTypes } from '../constants';
import {
  attachListener,
  detachListener,
  listenerExists,
  orderedFromSnap,
  dataByIdSnapshot,
  getQueryConfig,
  getQueryName,
  firestoreRef,
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
    ref: firestoreRef(firebase, dispatch, meta),
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
    ref: firestoreRef(firebase, dispatch, meta),
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
    ref: firestoreRef(firebase, dispatch, meta),
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
  const {
    mergeOrdered,
    mergeOrderedDocUpdates,
    mergeOrderedCollectionUpdates,
  } =
    firebase._.config || {};
  // Create listener
  const unsubscribe = firestoreRef(firebase, dispatch, meta).onSnapshot(
    docData => {
      const docChanges =
        typeof docData.docChanges === 'function'
          ? docData.docChanges()
          : docData.docChanges;
      // Dispatch different actions for doc changes (only update doc(s) by key)
      if (docChanges && docChanges.length < docData.size) {
        if (docChanges.length === 1) {
          // Dispatch doc update if there is only one
          dispatch(docChangeEvent(docChanges[0], meta));
        } else {
          // Loop to dispatch for each change if there are multiple
          // TODO: Option for dispatching multiple changes in single action
          docChanges.forEach(change => {
            dispatch(docChangeEvent(change, meta));
          });
        }
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
      // Invoke success callback if it exists
      if (successCb) successCb(docData);
    },
    err => {
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
      if (errorCb) errorCb(err);
    },
  );
  attachListener(firebase, dispatch, meta, unsubscribe);
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

  // Only attach one listener (count of matching listener path calls is tracked)
  if (config.oneListenerPerPath) {
    return listeners.forEach(listener => {
      const path = getQueryName(listener);
      const oldListenerCount = pathListenerCounts[path] || 0;
      pathListenerCounts[path] = oldListenerCount + 1;

      // If we already have an attached listener exit here
      if (oldListenerCount > 0) {
        return;
      }

      setListener(firebase, dispatch, listener);
    });
  }

  return listeners.forEach(listener => {
    // Config for supporting attaching of multiple listener callbacks
    const multipleListenersEnabled = isFunction(config.allowMultipleListeners)
      ? config.allowMultipleListeners(listener, firebase._.listeners)
      : config.allowMultipleListeners;

    // Only attach listener if it does not already exist or
    // if multiple listeners config is true or is a function which returns
    // truthy value
    if (!listenerExists(firebase, listener) || multipleListenersEnabled) {
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

  // Keep one listener path even when detaching
  if (config.oneListenerPerPath) {
    listeners.forEach(listener => {
      const path = getQueryName(listener);
      pathListenerCounts[path] -= 1;

      // If we aren't supposed to have listners for this path, then remove them
      if (pathListenerCounts[path] === 0) {
        unsetListener(firebase, dispatch, listener);
      }
    });

    return;
  }

  listeners.forEach(listener => {
    // Remove listener only if it exists
    unsetListener(firebase, dispatch, listener);
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
