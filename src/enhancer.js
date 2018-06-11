import { defaultConfig } from './constants';
import createFirestoreInstance from './createFirestoreInstance';

let firestoreInstance;

/**
 * @name reduxFirestore
 * @external
 * @description Redux store enhancer that accepts configuration options and adds
 * store.firestore. Enhancers are most commonly placed in redux's `compose` call
 * along side applyMiddleware.
 * @property {Object} firebaseInstance - Initiated firebase instance
 * @property {Object} config - Containing react-redux-firebase specific configuration
 * @return {Function} That accepts a component and returns a Component which
 * wraps the provided component (higher order component).
 * @return {Function} That enhances a redux store with store.firestore
 * @example <caption>Setup</caption>
 * import { createStore, compose } from 'redux'
 * import { reduxFirestore } from 'redux-firestore'
 * import firebase from 'firebase' // must be 4.5.0 or higher
 import 'firebase/firestore' // make sure you add this for firestore

 * // Redux Firestore Config
 * const config = {
 *   // here is where you place other config options
 * }

 * // initialize script from Firestore page
 * const fbConfg = {} // firebase config object
 * firebase.initializeApp(fbConfig)
 * firebase.firestore()
 *
 * // Add redux-firestore enhancer to store creation compose
 * // Note: In full projects this will often be within createStore.js or store.js
 const store = createStore(
     makeRootReducer(),
     initialState,
     compose(
       // pass firebase instance and config
       reduxFirestore(firebase, reduxConfig),
      //  applyMiddleware(...middleware),
      //  ...enhancers
     )
   )
 *
 * // Use Function later to create store
 * const store = createStoreWithFirestore(rootReducer, initialState)
 */
export default function reduxFirestore(firebaseInstance, otherConfig) {
  return next => (reducer, initialState, middleware) => {
    const store = next(reducer, initialState, middleware);

    const configs = { ...defaultConfig, ...otherConfig };
    firestoreInstance = createFirestoreInstance(
      firebaseInstance.firebase_ || firebaseInstance, // eslint-disable-line no-underscore-dangle, no-undef, max-len
      configs,
      store.dispatch, // eslint-disable-line comma-dangle
    );

    store.firestore = firestoreInstance;

    return store;
  };
}

/**
 * @description Expose Firestore instance created internally. Useful for
 * integrations into external libraries such as redux-thunk and redux-observable.
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
 *    const firebase = getFirestore()
 *    firebase
 *      .add('todos', newTodo)
 *      .then(() => {
 *        dispatch({ type: 'SOME_ACTION' })
 *      })
 * };
 *
 */
export const getFirestore = () => {
  // TODO: Handle recieveing config and creating firebase instance if it doesn't exist
  /* istanbul ignore next: Firebase instance always exists during tests */
  if (!firestoreInstance) {
    throw new Error(
      'Firebase instance does not yet exist. Check your compose function.',
    );
  }
  // TODO: Create new firebase here with config passed in
  return firestoreInstance;
};
