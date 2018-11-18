import { combineReducers } from 'redux'
import { firebaseReducer as firebase } from 'react-redux-firebase'
import { reducer as firestore } from 'redux-firestore'
import { reducer as form } from 'redux-form'
import { reducer as notifications } from 'modules/notification'
import locationReducer from './location'

export function makeRootReducer(asyncReducers) {
  return combineReducers({
    // Add sync reducers here
    firebase,
    firestore,
    form,
    notifications,
    location: locationReducer,
    ...asyncReducers
  })
}

export function injectReducer(store, { key, reducer }) {
  store.asyncReducers[key] = reducer
  store.replaceReducer(makeRootReducer(store.asyncReducers))
}

export default makeRootReducer
