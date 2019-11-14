/**
 * @constant
 * Prefix for all actions within library
 * @example
 * import { constants } from 'react-redux-firebase'
 * constants.actionsPrefix === '@@reduxFirestore' // true
 */
export const actionsPrefix = '@@reduxFirestore';

/**
 * @constant
 * Object containing all action types
 * @property START - `@@reduxFirestore/START`
 * @property ERROR - `@@reduxFirestore/ERROR`
 * @property SET_LISTENER - `@@reduxFirestore/SET_LISTENER`
 * @property UNSET_LISTENER - `@@reduxFirestore/UNSET_LISTENER`
 * @property LISTENER_RESPONSE - `@@reduxFirestore/LISTENER_RESPONSE`
 * @property LISTENER_ERROR - `@@reduxFirestore/LISTENER_ERROR`
 * @property CLEAR_DATA - `@@reduxFirestore/CLEAR_DATA`
 * @property CLEAR_ERROR - `@@reduxFirestore/CLEAR_ERROR`
 * @property CLEAR_ERRORS - `@@reduxFirestore/CLEAR_ERRORS`
 * @property GET_REQUEST - `@@reduxFirestore/GET_REQUEST`
 * @property GET_SUCCESS - `@@reduxFirestore/GET_SUCCESS`
 * @property GET_FAILURE - `@@reduxFirestore/GET_FAILURE`
 * @property SET_REQUEST - `@@reduxFirestore/SET_REQUEST`
 * @property SET_SUCCESS - `@@reduxFirestore/SET_SUCCESS`
 * @property SET_FAILURE - `@@reduxFirestore/SET_FAILURE`
 * @property ADD_REQUEST - `@@reduxFirestore/ADD_REQUEST`
 * @property ADD_SUCCESS - `@@reduxFirestore/ADD_SUCCESS`
 * @property ADD_FAILURE - `@@reduxFirestore/ADD_FAILURE`
 * @property UPDATE_REQUEST - `@@reduxFirestore/UPDATE_REQUEST`
 * @property UPDATE_SUCCESS - `@@reduxFirestore/UPDATE_SUCCESS`
 * @property UPDATE_FAILURE - `@@reduxFirestore/UPDATE_FAILURE`
 * @property DELETE_REQUEST - `@@reduxFirestore/DELETE_REQUEST`
 * @property DELETE_SUCCESS - `@@reduxFirestore/DELETE_SUCCESS`
 * @property DELETE_FAILURE - `@@reduxFirestore/DELETE_FAILURE`
 * @property ON_SNAPSHOT_REQUEST - `@@reduxFirestore/ON_SNAPSHOT_REQUEST`
 * @property ON_SNAPSHOT_SUCCESS - `@@reduxFirestore/ON_SNAPSHOT_SUCCESS`
 * @property ON_SNAPSHOT_FAILURE - `@@reduxFirestore/ON_SNAPSHOT_FAILURE`
 * @property TRANSACTION_START - `@@reduxFirestore/TRANSACTION_START`
 * @property TRANSACTION_SUCCESS - `@@reduxFirestore/TRANSACTION_SUCCESS`
 * @property TRANSACTION_FAILURE - `@@reduxFirestore/TRANSACTION_FAILURE`
 * @example
 * import { actionTypes } from 'react-redux-firebase'
 * actionTypes.SET === '@@reduxFirestore/SET' // true
 */
export const actionTypes = {
  START: `${actionsPrefix}/START`,
  ERROR: `${actionsPrefix}/ERROR`,
  CLEAR_DATA: `${actionsPrefix}/CLEAR_DATA`,
  CLEAR_ERROR: `${actionsPrefix}/CLEAR_ERROR`,
  CLEAR_ERRORS: `${actionsPrefix}/CLEAR_ERRORS`,
  SET_LISTENER: `${actionsPrefix}/SET_LISTENER`,
  UNSET_LISTENER: `${actionsPrefix}/UNSET_LISTENER`,
  GET_REQUEST: `${actionsPrefix}/GET_REQUEST`,
  GET_SUCCESS: `${actionsPrefix}/GET_SUCCESS`,
  GET_FAILURE: `${actionsPrefix}/GET_FAILURE`,
  SET_REQUEST: `${actionsPrefix}/SET_REQUEST`,
  SET_SUCCESS: `${actionsPrefix}/SET_SUCCESS`,
  SET_FAILURE: `${actionsPrefix}/SET_FAILURE`,
  ADD_REQUEST: `${actionsPrefix}/ADD_REQUEST`,
  ADD_SUCCESS: `${actionsPrefix}/ADD_SUCCESS`,
  ADD_FAILURE: `${actionsPrefix}/ADD_FAILURE`,
  UPDATE_REQUEST: `${actionsPrefix}/UPDATE_REQUEST`,
  UPDATE_SUCCESS: `${actionsPrefix}/UPDATE_SUCCESS`,
  UPDATE_FAILURE: `${actionsPrefix}/UPDATE_FAILURE`,
  DELETE_REQUEST: `${actionsPrefix}/DELETE_REQUEST`,
  DELETE_SUCCESS: `${actionsPrefix}/DELETE_SUCCESS`,
  DELETE_FAILURE: `${actionsPrefix}/DELETE_FAILURE`,
  ATTACH_LISTENER: `${actionsPrefix}/ATTACH_LISTENER`,
  LISTENER_RESPONSE: `${actionsPrefix}/LISTENER_RESPONSE`,
  LISTENER_ERROR: `${actionsPrefix}/LISTENER_ERROR`,
  ON_SNAPSHOT_REQUEST: `${actionsPrefix}/ON_SNAPSHOT_REQUEST`,
  ON_SNAPSHOT_SUCCESS: `${actionsPrefix}/ON_SNAPSHOT_SUCCESS`,
  ON_SNAPSHOT_FAILURE: `${actionsPrefix}/ON_SNAPSHOT_FAILURE`,
  DOCUMENT_ADDED: `${actionsPrefix}/DOCUMENT_ADDED`,
  DOCUMENT_MODIFIED: `${actionsPrefix}/DOCUMENT_MODIFIED`,
  DOCUMENT_REMOVED: `${actionsPrefix}/DOCUMENT_REMOVED`,
  TRANSACTION_START: `${actionsPrefix}/TRANSACTION_START`,
  TRANSACTION_SUCCESS: `${actionsPrefix}/TRANSACTION_SUCCESS`,
  TRANSACTION_FAILURE: `${actionsPrefix}/TRANSACTION_FAILURE`,
};

/**
 * @constant
 * @name defaultConfig
 * Default configuration options
 * @property logListenerError - `true` Whether or not to use
 * console.error to log listener error objects. Errors from listeners
 * are helpful to developers on multiple occasions including when index
 * needs to be added.
 * @property preserveOnDelete - `null` Values to
 * preserve from state when DELETE_SUCCESS action is dispatched. Note that this
 * will not prevent the LISTENER_RESPONSE action from removing items from
 * state.ordered if you have a listener attached.
 * @property preserveOnListenerError - `null` Values to
 * preserve from state when LISTENER_ERROR action is dispatched.
 * @property enhancerNamespace - `'firestore'` Namespace under which
 * enhancer places internal instance on redux store (i.e. store.firestore).
 * @property allowMultipleListeners - `false` Whether or not
 * to allow multiple listeners to be attached for the same query. If a function
 * is passed the arguments it receives are `listenerToAttach`,
 * `currentListeners`, and the function should return a boolean.
 * @property onAttemptCollectionDelete - `null` (arguments:
 * `(queryOption, dispatch, firebase)`) Function run when attempting to delete
 * a collection. If not provided (default) delete promise will be rejected with
 * "Only documents can be deleted" unless. This is due to the fact that
 * Collections can not be deleted from a client, it should instead be handled
 * within a cloud function (which can be called by providing a promise
 * to `onAttemptCollectionDelete` that calls the cloud function).
 */
export const defaultConfig = {
  logListenerError: true,
  enhancerNamespace: 'firestore',
  helpersNamespace: null,
  allowMultipleListeners: false,
  preserveOnDelete: null,
  preserveOnListenerError: null,
  onAttemptCollectionDelete: null,
  mergeOrdered: true,
  mergeOrderedDocUpdates: true,
  mergeOrderedCollectionUpdates: true,
};

export const methodsToAddFromFirestore = [
  'collection',
  'collectionGroup',
  'configureClient',
  'doc',
  'batch',
  'disableNetwork',
  'enableNetwork',
  'enablePersistence',
  'ensureClientConfigured',
  'setLogLevel',
  'settings',
];

export default {
  actionsPrefix,
  actionTypes,
  defaultConfig,
};
