import { authActions, firestoreActions } from './actions';

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
  // Enable Logging based on config (handling instances without i.e RNFirebase)
  if (
    configs.enableLogging &&
    firebase.database &&
    typeof firebase.database.enableLogging === 'function'
  ) {
    firebase.database.enableLogging(configs.enableLogging);
  }

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
   * @description Logs user into Firebase. For examples, visit the [auth section](/docs/auth.md)
   * @param {Object} credentials - Credentials for authenticating
   * @param {String} credentials.provider - External provider (google | facebook | twitter)
   * @param {String} credentials.type - Type of external authentication
   * (popup | redirect) (only used with provider)
   * @param {String} credentials.email - Credentials for authenticating
   * @param {String} credentials.password - Credentials for authenticating (only used with email)
   * @return {Promise} Containing user's auth data
   */
  const login = credentials =>
    authActions.login(dispatch, firebase, credentials);

  /**
   * @description Logs user out of Firebase and empties firebase state from
   * redux store
   * @return {Promise}
   */
  const logout = () =>
    authActions.logout(dispatch, firebase);

  /**
   * @description Creates a new user in Firebase authentication. If
   * `userProfile` config option is set, user profiles will be set to this
   * location.
   * @param {Object} credentials - Credentials for authenticating
   * @param {String} credentials.email - Credentials for authenticating
   * @param {String} credentials.password - Credentials for authenticating (only used with email)
   * @param {Object} profile - Data to include within new user profile
   * @return {Promise} Containing user's auth data
   */
  const createUser = (credentials, profile) =>
    authActions.createUser(dispatch, firebase, credentials, profile);

  /**
   * @description Sends password reset email
   * @param {Object} credentials - Credentials for authenticating
   * @param {String} credentials.email - Credentials for authenticating
   * @return {Promise}
   */
  const resetPassword = credentials =>
    authActions.resetPassword(dispatch, firebase, credentials);

  /**
   * @description Confirm that a user's password has been reset
   * @param {String} code - Password reset code to verify
   * @param {String} password - New Password to confirm reset to
   * @return {Promise}
   */
  const confirmPasswordReset = (code, password) =>
    authActions.confirmPasswordReset(dispatch, firebase, code, password);

  /**
   * @description Verify that a password reset code from a password reset
   * email is valid
   * @param {String} code - Password reset code to verify
   * @return {Promise} Containing user auth info
   */
  const verifyPasswordResetCode = code =>
    authActions.verifyPasswordResetCode(dispatch, firebase, code);

  /**
   * @description Update user profile
   * @param {Object} profile - Profile data to place in new profile
   * @return {Promise}
   */
  const updateProfile = profileUpdate =>
    authActions.updateProfile(dispatch, firebase, profileUpdate);

  /**
   * @description Update Auth Object
   * @param {Object} authUpdate - Update to be auth object
   * @param {Boolean} updateInProfile - Update in profile
   * @return {Promise}
   */
  const updateAuth = (authUpdate, updateInProfile) =>
    authActions.updateAuth(dispatch, firebase, authUpdate, updateInProfile);

  /**
   * @description Update user's email
   * @param {String} newEmail - Update to be auth object
   * @param {Boolean} updateInProfile - Update in profile
   * @return {Promise}
   */
  const updateEmail = (newEmail, updateInProfile) =>
    authActions.updateEmail(dispatch, firebase, newEmail, updateInProfile);

  /**
   * @description Reload user's auth object. Must be authenticated.
   * @return {Promise}
   */
  const reloadAuth = () => authActions.reloadAuth(dispatch, firebase);

  /**
   * @description Links the user account with the given credentials.
   * @param {firebase.auth.AuthCredential} credential - The auth credential
   * @return {Promise}
   */
  const linkWithCredential = credential =>
    authActions.linkWithCredential(dispatch, firebase, credential);

  /**
   * @name ref
   * @description Firebase ref function
   * @return {firebase.database.Reference}
   */
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
  const helpers = {
    ref: path => firebase.database().ref(path),
    get,
    add,
    set,
    onSnapshot,
    login,
    logout,
    updateAuth,
    updateEmail,
    updateProfile,
    createUser,
    resetPassword,
    confirmPasswordReset,
    verifyPasswordResetCode,
    reloadAuth,
    linkWithCredential,
  };

  return Object.assign(firebase, helpers, { helpers });
};

export default createFirebaseInstance;
