import { reduce } from 'lodash';
import { merge } from 'lodash/fp';
import { firestoreActions } from './actions';
import { mapWithFirebaseAndDispatch } from './utils/actions';
import { defaultConfig, methodsToAddFromFirestore } from './constants';

/**
 * Create a firebase instance that has helpers attached for dispatching actions
 * @param  {Object} firebase - Firebase instance which to extend
 * @param  {Object} configs - Configuration object
 * @param  {Function} dispatch - Action dispatch function
 * @return {Object} Extended Firebase instance
 */
export default function createFirestoreInstance(firebase, configs, dispatch) {
  // Setup internal variables
  const defaultInternals = {
    // Setup empty listeners object (later used to track listeners)
    listeners: {},
    // Extend default config with provided config
    config: { defaultConfig, ...configs },
  };

  // extend existing firebase internals (using redux-firestore along with redux-firebase)
  firebase._ = merge(defaultInternals, firebase._); // eslint-disable-line no-param-reassign

  // Aliases for methods
  const aliases = [
    { action: firestoreActions.deleteRef, name: 'delete' },
    { action: firestoreActions.setListener, name: 'onSnapshot' },
  ];

  // Create methods with internal firebase object and dispatch passed
  const methods = mapWithFirebaseAndDispatch(
    firebase,
    dispatch,
    firestoreActions,
    aliases,
  );

  // Only include specific methods from Firestore since other methods
  // are extended (list in constants)
  const methodsFromFirestore = reduce(
    methodsToAddFromFirestore,
    (acc, methodName) =>
      firebase.firestore &&
      typeof firebase.firestore()[methodName] === 'function'
        ? {
            ...acc,
            [methodName]: firebase
              .firestore()
              [methodName].bind(firebase.firestore()),
          }
        : acc,
    {},
  );

  return Object.assign(
    methodsFromFirestore,
    firebase.firestore,
    { _: firebase._ },
    configs.helpersNamespace
      ? // Attach helpers to specified namespace
        { [configs.helpersNamespace]: methods }
      : methods,
  );
}
