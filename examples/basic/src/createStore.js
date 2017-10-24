import { createStore, compose } from 'redux'
import rootReducer from './reducer'
import { reduxFirestore } from 'redux-firestore'
import firebase from 'firebase'
import 'firebase/firestore'

const fbConfig = {
  apiKey: 'AIzaSyCTUERDM-Pchn_UDTsfhVPiwM4TtNIxots',
  authDomain: 'redux-firebasev3.firebaseapp.com',
  databaseURL: 'https://redux-firebasev3.firebaseio.com',
  storageBucket: 'redux-firebasev3.appspot.com',
  messagingSenderId: '823357791673',
  projectId: 'redux-firebasev3'
}

firebase.initializeApp(fbConfig)
firebase.firestore()

export default function configureStore(initialState, history) {
  const enhancers = []
  const devToolsExtension = window.devToolsExtension;
  if (typeof devToolsExtension === 'function') {
    enhancers.push(devToolsExtension());
  }
  const createStoreWithMiddleware = compose(
    reduxFirestore(firebase,
      {
        userProfile: 'users'
      }
    ),
    ...enhancers
  )(createStore)
  const store = createStoreWithMiddleware(rootReducer)

  return store
}
