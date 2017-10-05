import { createStore, compose } from 'redux'
import rootReducer from './reducer'
import { reduxFirestore } from 'redux-firestore'
import firebase from 'firebase'

const fbConfig = {
  apiKey: 'AIzaSyCTUERDM-Pchn_UDTsfhVPiwM4TtNIxots',
  authDomain: 'redux-firebasev3.firebaseapp.com',
  databaseURL: 'https://redux-firebasev3.firebaseio.com',
  storageBucket: 'redux-firebasev3.appspot.com',
  messagingSenderId: '823357791673'
}

firebase.initializeApp(fbConfig)

export default function configureStore(initialState, history) {
  const createStoreWithMiddleware = compose(
    reduxFirestore(firebase,
      {
        userProfile: 'users'
      }
    ),
  )(createStore)
  const store = createStoreWithMiddleware(rootReducer)

  return store
}
