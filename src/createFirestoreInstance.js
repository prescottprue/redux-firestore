import { merge } from 'lodash/fp';
import { firestoreActions } from './actions';
import { mapWithFirebaseAndDispatch } from './utils/actions';
import { defaultConfig, methodsToAddFromFirestore } from './constants';

let firestoreInstance;

/**
 * Create a firebase instance that has helpers attached for dispatching actions
 * @param {object} firebase - Firebase instance which to extend
 * @param {object} configs - Configuration object
 * @param {Function} dispatch - Action dispatch function
 * @returns {object} Extended Firebase instance
 */
export default function createFirestoreInstance(firebase, configs, dispatch) {
  // Setup internal variables
  const defaultInternals = {
    // Setup empty listeners object (later used to track listeners)
    listeners: {},
    // Setup empty path listeners count object (later used to track listeners)
    pathListenerCounts: {},
    // Extend default config with provided config
    config: { ...defaultConfig, ...configs },
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
  const methodsFromFirestore = methodsToAddFromFirestore.reduce(
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

  firestoreInstance = Object.assign(
    methodsFromFirestore,
    firebase.firestore,
    { _: firebase._ },
    configs.helpersNamespace
      ? // Attach helpers to specified namespace
        { [configs.helpersNamespace]: methods }
      : methods,
  );

  return firestoreInstance;
}

/**
 * Expose Firestore instance created internally. Useful for
 * integrations into external libraries such as redux-thunk and redux-observable.
 * @returns {object} Firebase Instance
 * @example <caption>redux-thunk integration</caption>
 * import { applyMiddleware, compose, createStore } from 'redux';
 * import thunk from 'redux-thunk';
 * import makeRootReducer from './reducers';
 * import { reduxFirestore, getFirestore } from 'redux-firestore';
 *
 * const fbConfig = {} // your firebase config
 *
 * const store = createStore(
 *   makeRootReducer(),
 *   initialState,
 *   compose(
 *     applyMiddleware([
 *       // Pass getFirestore function as extra argument
 *       thunk.withExtraArgument(getFirestore)
 *     ]),
 *     reduxFirestore(fbConfig)
 *   )
 * );
 * // then later
 * export const addTodo = (newTodo) =>
 *  (dispatch, getState, getFirestore) => {
 *    const firestore = getFirestore()
 *    firestore
 *      .add('todos', newTodo)
 *      .then(() => {
 *        dispatch({ type: 'SOME_ACTION' })
 *      })
 * };
 */
export function getFirestore() {
  /* istanbul ignore next: Firestore instance always exists during tests */
  if (!firestoreInstance) {
    throw new Error('Firestore instance does not yet exist. Check your setup.');
  }
  return firestoreInstance;
}
