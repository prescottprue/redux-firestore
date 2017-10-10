import { firestoreActions } from './actions';

/**
 * Create a firebase instance that has helpers attached for dispatching actions
 * @param  {Object} firebase - Firebase instance which to extend
 * @param  {Object} configs - Configuration object
 * @param  {Function} dispatch - Action dispatch function
 * @return {Object} Extended Firebase instance
 * @private
 */
export const createFirebaseInstance = (firebase, configs, dispatch) => {
  /* istanbul ignore next: Logging is external */
  // Add internal variables to firebase instance
  const defaultInternals = { watchers: {}, config: configs, authUid: null };
  Object.defineProperty(firebase, '_', {
    value: defaultInternals,
    writable: true,
    enumerable: true,
    configurable: true,
  });

  /**
   * @description Get data from Firestore
   * @param {String} collection - Collection within Firestore
   * @param {String} doc - Document
   * @param {Object} opts - Name of listener results within redux store
   * @return {Promise}
   */
  const get = (collection, doc, opts) =>
    firestoreActions.get(firebase, dispatch, collection, doc, opts);

  /**
   * @description Get data from Firestore
   * @param {String} collection - Collection within Firestore
   * @param {String} doc - Document
   * @param {Object} opts - Name of listener results within redux store
   * @return {Promise}
   */
  const set = (collection, doc, opts) =>
    firestoreActions.set(firebase, dispatch, collection, doc, opts);

  /**
   * @description Add data to Firestore
   * @param {String} eventName - Type of watch event
   * @param {String} eventPath - Database path on which to setup watch event
   * @param {String} storeAs - Name of listener results within redux store
   * @return {Promise}
   */
  const add = (collection, doc, opts) =>
    firestoreActions.add(firebase, dispatch, collection, doc, opts);

  /**
   * @description Add data to Firestore
   * @param {String} eventName - Type of watch event
   * @param {String} eventPath - Database path on which to setup watch event
   * @param {String} storeAs - Name of listener results within redux store
   * @return {Promise}
   */
  const onSnapshot = (collection, doc, opts) =>
    firestoreActions.onSnapshot(firebase, dispatch, collection, doc, opts);

  /**
   * @name database
   * @description Firebase database service instance including all Firebase storage methods
   * @return {firebase.database.Database} Firebase database service
   */
  /**
   * @name storage
   * @description Firebase storage service instance including all Firebase storage methods
   * @return {firebase.database.Storage} Firebase storage service
   */
  /**
   * @name auth
   * @description Firebase auth service instance including all Firebase auth methods
   * @return {firebase.database.Auth}
   */
  return {
    get,
    add,
    set,
    onSnapshot,
    ...firebase,
  };
};

export default createFirebaseInstance;
