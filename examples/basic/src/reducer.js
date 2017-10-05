import { combineReducers } from 'redux'
import { firebaseReducer as firebase } from 'redux-firestore'

const rootReducer = combineReducers({
  firebase,
});

export default rootReducer
