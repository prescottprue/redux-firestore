import { firestoreActions } from './actions';
import { mapWithFirebaseAndDispatch } from './utils/actions';

/**
 * Create a firebase instance that has helpers attached for dispatching actions
 * @param  {Object} firebase - Firebase instance which to extend
 * @param  {Object} configs - Configuration object
 * @param  {Function} dispatch - Action dispatch function
 * @return {Object} Extended Firebase instance
 */
const createFirestoreInstance = (firebase, configs, dispatch) => {
  // Add internal variables to firebase instance
  const defaultInternals = { listeners: {} };

  const aliases = [
    { action: firestoreActions.deleteRef, name: 'delete' },
    { action: firestoreActions.setListener, name: 'onSnapshot' },
  ];

  // support extending existing firebase internals (using redux-firestore along with redux-firebase)
  firebase._ = firebase._ // eslint-disable-line no-param-reassign
    ? { ...firebase._, ...defaultInternals }
    : defaultInternals;

  const methods = mapWithFirebaseAndDispatch(
    firebase,
    dispatch,
    firestoreActions,
    aliases,
  );

  if (configs.helpersNamespace) {
    return {
      ...firebase.firestore,
      [configs.helpersNamespace]: methods,
    };
  }
  return {
    ...firebase.firestore,
    ...methods,
  };
};

export default createFirestoreInstance;
