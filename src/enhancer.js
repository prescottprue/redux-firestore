import { defaultConfig } from './constants';
import createFirestoreInstance from './createFirestoreInstance';

/**
 * @name reduxFirestore
 * @external
 * Redux store enhancer that accepts configuration options and adds
 * store.firestore. Enhancers are most commonly placed in redux's `compose` call
 * along side applyMiddleware.
 * @param {object} firebaseInstance - Initiated firebase instance
 * @param {object} otherConfig - Containing react-redux-firebase specific configuration
 * @returns {Function} That accepts a component and returns a Component which
 * wraps the provided component (higher order component).
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
    store.firestore = createFirestoreInstance(
      firebaseInstance.firebase_ || firebaseInstance, // eslint-disable-line no-underscore-dangle, no-undef, max-len
      configs,
      store.dispatch, // eslint-disable-line comma-dangle
    );

    return store;
  };
}
