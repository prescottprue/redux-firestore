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
 * @property {String} ERROR - `@@reduxFirestore/ERROR`
 * @property {String} SET_LISTENER - `@@reduxFirestore/SET_LISTENER`
 * @property {String} UNSET_LISTENER - `@@reduxFirestore/UNSET_LISTENER`
 * @property {String} LISTENER_RESPONSE - `@@reduxFirestore/LISTENER_RESPONSE`
 * @property {String} LISTENER_ERROR - `@@reduxFirestore/LISTENER_ERROR`
 * @property {String} CLEAR_DATA - `@@reduxFirestore/CLEAR_DATA`
 * @property {String} CLEAR_ERROR - `@@reduxFirestore/CLEAR_ERROR`
 * @property {String} CLEAR_ERRORS - `@@reduxFirestore/CLEAR_ERRORS`
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
 * @property {String} DELETE_REQUEST - `@@reduxFirestore/DELETE_REQUEST`
 * @property {String} DELETE_SUCCESS - `@@reduxFirestore/DELETE_SUCCESS`
 * @property {String} DELETE_FAILURE - `@@reduxFirestore/DELETE_FAILURE`
 * @property {String} ON_SNAPSHOT_REQUEST - `@@reduxFirestore/ON_SNAPSHOT_REQUEST`
 * @property {String} ON_SNAPSHOT_SUCCESS - `@@reduxFirestore/ON_SNAPSHOT_SUCCESS`
 * @property {String} ON_SNAPSHOT_FAILURE - `@@reduxFirestore/ON_SNAPSHOT_FAILURE`
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
};

/**
 * @constant
 * @type {Object}
 * @name defaultConfig
 * @description Default configuration options
 * @property {Boolean} enableLogging - `false` Whether or not firebase
 * database logging is enabled.
 * @property {Boolean} enhancerNamespace - `'firestore'` Namespace underwhich
 * enhancer places internal instance on redux store (i.e. store.firestore).
 * @type {Object}
*/
export const defaultConfig = {
  enableLogging: false,
  enhancerNamespace: 'firestore',
  helpersNamespace: null,
};

export default {
  actionsPrefix,
  actionTypes,
  defaultConfig,
};
