import { combineReducers } from 'redux'
import { firestoreReducer as firestore } from 'redux-firestore'

const rootReducer = combineReducers({
  firestore,
});

export default rootReducer
