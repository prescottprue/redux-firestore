import { createStore, compose } from 'redux'
import { reduxFirestore } from 'redux-firestore'
import firebase from 'firebase/app'
import 'firebase/firestore'
import { fbConfig } from './config'
import rootReducer from './reducer'

// import 'firebase/storage'

firebase.initializeApp(fbConfig)

// Provide timestamp settings to silence warning about deprecation
firebase.firestore().settings({ timestampsInSnapshots: true })

export default function configureStore(initialState, history) {
  const enhancers = []

  // Dev tools store enhancer
  const devToolsExtension = window.devToolsExtension;
  if (typeof devToolsExtension === 'function') {
    enhancers.push(devToolsExtension());
  }

  const createStoreWithMiddleware = compose(
    // Add redux firestore store enhancer
    reduxFirestore(firebase),
    ...enhancers
  )(createStore)

  const store = createStoreWithMiddleware(rootReducer)

  return store
}
