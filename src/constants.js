/**
 * @constant
 * @type {String}
 * @description Prefix for all actions within library
 * @example
 * import { constants } from 'react-redux-firebase'
 * constants.actionsPrefix === '@@reduxFirestore' // true
*/
export const actionsPrefix = '@@reduxFirestore';

/**
 * @constant
 * @type {Object}
 * @description Object containing all action types
 * @property {String} START - `@@reduxFirestore/START`
 * @property {String} SET - `@@reduxFirestore/SET`
 * @property {String} SET_PROFILE - `@@reduxFirestore/SET_PROFILE`
 * @property {String} LOGIN - `@@reduxFirestore/LOGIN`
 * @property {String} LOGOUT - `@@reduxFirestore/LOGOUT`
 * @property {String} ERROR - `@@reduxFirestore/ERROR`
 * @property {String} SET_LISTENER - `@@reduxFirestore/SET_LISTENER`
 * @property {String} UNSET_LISTENER - `@@reduxFirestore/UNSET_LISTENER`
 * @property {String} AUTHENTICATION_INIT_STARTED - `@@reactReduxFirebase/AUTHENTICATION_INIT_STARTED`
 * @property {String} AUTHENTICATION_INIT_FINISHED - `@@reactReduxFirebase/AUTHENTICATION_INIT_FINISHED`
 * @property {String} GET_REQUEST - `@@reduxFirestore/GET_REQUEST`
 * @property {String} GET_SUCCESS - `@@reduxFirestore/GET_SUCCESS`
 * @property {String} GET_FAILURE - `@@reduxFirestore/GET_FAILURE`
 * @property {String} SET_REQUEST - `@@reduxFirestore/SET_REQUEST`
 * @property {String} SET_SUCCESS - `@@reduxFirestore/SET_SUCCESS`
 * @property {String} SET_FAILURE - `@@reduxFirestore/SET_FAILURE`
 * @property {String} ADD_REQUEST - `@@reduxFirestore/ADD_REQUEST`
 * @property {String} ADD_SUCCESS - `@@reduxFirestore/ADD_SUCCESS`
 * @property {String} ADD_FAILURE - `@@reduxFirestore/ADD_FAILURE`
 * @property {String} UPDATE_REQUEST - `@@reduxFirestore/UPDATE_REQUEST`
 * @property {String} UPDATE_SUCCESS - `@@reduxFirestore/UPDATE_SUCCESS`
 * @property {String} UPDATE_FAILURE - `@@reduxFirestore/UPDATE_FAILURE`
 * @property {String} ON_SNAPSHOT_REQUEST - `@@reduxFirestore/ON_SNAPSHOT_REQUEST`
 * @property {String} ON_SNAPSHOT_SUCCESS - `@@reduxFirestore/ON_SNAPSHOT_SUCCESS`
 * @property {String} ON_SNAPSHOT_FAILURE - `@@reduxFirestore/ON_SNAPSHOT_FAILURE`
 * @example
 * import { actionTypes } from 'react-redux-firebase'
 * actionTypes.SET === '@@reduxFirestore/SET' // true
*/
export const actionTypes = {
  START: `${actionsPrefix}/START`,
  SET: `${actionsPrefix}/SET`,
  SET_PROFILE: `${actionsPrefix}/SET_PROFILE`,
  LOGIN: `${actionsPrefix}/LOGIN`,
  LOGOUT: `${actionsPrefix}/LOGOUT`,
  ERROR: `${actionsPrefix}/ERROR`,
  AUTH_EMPTY_CHANGE: `${actionsPrefix}/AUTH_EMPTY_CHANGE`,
  SET_LISTENER: `${actionsPrefix}/SET_LISTENER`,
  UNSET_LISTENER: `${actionsPrefix}/UNSET_LISTENER`,
  AUTHENTICATION_INIT_STARTED: `${actionsPrefix}/AUTHENTICATION_INIT_STARTED`,
  AUTHENTICATION_INIT_FINISHED: `${actionsPrefix}/AUTHENTICATION_INIT_FINISHED`,
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
  ON_SNAPSHOT_REQUEST: `${actionsPrefix}/ON_SNAPSHOT_REQUEST`,
  ON_SNAPSHOT_SUCCESS: `${actionsPrefix}/ON_SNAPSHOT_SUCCESS`,
  ON_SNAPSHOT_FAILURE: `${actionsPrefix}/ON_SNAPSHOT_FAILURE`,
};

/**
 * @constant
 * @type {Object}
 * @name defaultConfig
 * @description Default configuration options
 * @property {String} userProfile - `null` Location on Firebase where user
 * profiles are stored. Often set to `'users'`.
 * @property {String|Function} presence - `null` Location on Firebase where of currently
 * online users is stored. Often set to `'presence'` or `'onlineUsers'`. If a function
 * is passed, the arguments are: `(currentUser, firebase)`.
 * @property {String|Function} sessions - `sessions` Location on Firebase where user
 * sessions are stored (only if presense is set). Often set to `'sessions'` or
 * `'userSessions'`. If a function is passed, the arguments are: `(currentUser, firebase)`.
 * @property {Boolean} enableLogging - `false` Whether or not firebase
 * database logging is enabled.
 * @property {Array} preserveOnLougout - `null` Data parameters to preserve when
 * logging out.
 * @property {Boolean} updateProfileOnLogin - `true` Whether or not to update
 * user profile when logging in.
 * @property {Boolean} resetBeforeLogin - `true` Whether or not to reset auth
 * and profile when logging in (see issue #254 for more details).
 * @property {Boolean} enableRedirectHandling - `true` Whether or not to enable
 * redirect handling. This must be disabled if environment is not http/https
 * such as with react-native.
 * @property {Boolean} enableEmptyAuthChanges - `false` Whether or not to enable
 * empty auth changes. When set to true, `onAuthStateChanged` will be fired with,
 * empty auth changes such as `undefined` on initialization
 * (see [#137](https://github.com/prescottprue/react-redux-firebase/issues/137)).
 * Requires `v1.5.0-alpha` or higher.
 * @property {Boolean} autoPopulateProfile - `false` REMOVED FROM v2.0.0. Whether or not to
 * automatically populate profile with data loaded through
 * profileParamsToPopulate config.
 * @property {Boolean} setProfilePopulateResults - `true` Whether or not to
 * call SET actions for data that results from populating profile to redux under
 * the data path. For example role parameter on profile populated from 'roles'
 * root. True will call SET_PROFILE as well as a SET action with the role that
 * is loaded (places it in data/roles).
 * @property {Boolean} dispatchOnUnsetListener - `false` Whether or not to
 * dispatch UNSET_LISTENER when disabling listeners for a specific path. USE WITH CAUTION
 * Setting this to true allows an action to be called that removes data
 * from redux (which might not always be expected).
 * @property {String} firebaseStateName - 'firebase' Assumed name of Firebase
 * state (name given when passing reducer to combineReducers). Used in
 * firebaseAuthIsReady promise (see #264).
 * @property {Boolean} attachAuthIsReady - `true` Whether or not to attach
 * firebaseAuthIsReady to store. authIsLoaded can be imported and used
 * directly instead based on preference.
 * @type {Object}
*/
export const defaultConfig = {
  userProfile: null,
  presence: null,
  sessions: 'sessions',
  enableLogging: false,
  resetBeforeLogin: true,
  updateProfileOnLogin: true,
  enableRedirectHandling: true,
  autoPopulateProfile: false,
  setProfilePopulateResults: false,
  dispatchOnUnsetListener: true,
  enableEmptyAuthChanges: false,
  stateName: 'firestore',
  attachAuthIsReady: false,
};

/**
 * @constant
 * @type {Array}
 * @description List of all external auth providers that are supported
 * (firebase's email/anonymous included by default).
 * @private
*/
export const supportedAuthProviders = [
  'google',
  'github',
  'twitter',
  'facebook',
];

/**
 * @constant
 * @description Top level redux paths that can be populated
 * @type {Array}
 * @private
 */
export const topLevelPaths = ['auth', 'profile', 'ordered', 'data'];

export default {
  actionTypes,
  defaultConfig,
};
