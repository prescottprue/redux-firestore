import { createStore, compose } from 'redux'
import rootReducer from './reducer'

export default function configureStore(initialState, history) {
  const enhancers = []

  // Dev tools store enhancer
  const devToolsExtension = window.devToolsExtension;
  if (typeof devToolsExtension === 'function') {
    enhancers.push(devToolsExtension());
  }

  const createStoreWithMiddleware = compose(
    // Add redux firestore store enhancer
    ...enhancers
  )(createStore)

  const store = createStoreWithMiddleware(rootReducer)

  return store
}
