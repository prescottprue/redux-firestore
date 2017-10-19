import { mapValues } from 'lodash';
import { firestoreActions } from './actions';

/**
 * Build a factory that passes firebase and dispatch as first two arguments
 * @param  {Object} firebase - Internal firebase instance
 * @param  {Function} dispatch - Redux's dispatch function
 * @return {Function} A wrapper that accepts a function to wrap with firebase
 * and dispatch.
 */
const createWithFirebaseAndDispatch = (firebase, dispatch) => func => (...args) =>
  func.apply(firebase, [firebase, dispatch, ...args]);

/**
 * Map each function within an Object with Firebase and Dispatch
 * @param  {Object} firebase - Internal firebase instance
 * @param  {Function} dispatch - Redux's dispatch function
 * @param  {Object} actions - Action functions to map with firebase and dispatch
 * @return {Object} Actions mapped with firebase and dispatch
 */
const mapWithFirebaseAndDispatch = (firebase, dispatch, actions) => {
  const withFirebaseAndDispatch = createWithFirebaseAndDispatch(firebase, dispatch);
  return mapValues(actions, withFirebaseAndDispatch);
};

/**
 * Create a firebase instance that has helpers attached for dispatching actions
 * @param  {Object} firebase - Firebase instance which to extend
 * @param  {Object} configs - Configuration object
 * @param  {Function} dispatch - Action dispatch function
 * @return {Object} Extended Firebase instance
 */
const createFirestoreInstance = (firebase, configs, dispatch) => {
  // Add internal variables to firebase instance
  const defaultInternals = { listeners: {}, config: configs, authUid: null };

  // support extending existing firebase internals (using redux-firestore along with redux-firebase)
  firebase._ = firebase._ // eslint-disable-line no-param-reassign
    ? { ...firebase._, ...defaultInternals }
    : defaultInternals;

  const methods = mapWithFirebaseAndDispatch(firebase, dispatch, firestoreActions);

  if (configs.firestoreNamespace) {
    return {
      [configs.firestoreNamespace]: methods,
      ...firebase,
    };
  }
  return {
    ...methods,
    ...firebase,
  };
};

export default createFirestoreInstance;
