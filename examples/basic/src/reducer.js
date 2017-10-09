import { combineReducers } from 'redux'
import { firestoreReducer as firebase } from 'redux-firestore'

const rootReducer = combineReducers({
  firebase,
});

export default rootReducer
