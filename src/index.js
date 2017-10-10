import enhancer from './enhancer';
import reducer from './reducer';
import constants, { actionTypes } from './constants';
import middleware, { CALL_FIRESTORE } from './middleware';
console.log('CALL_FIRESTORE', CALL_FIRESTORE)
export default {
  firestoreReducer: reducer,
  reduxFirestore: enhancer,
  reducer,
  enhancer,
  constants,
  actionTypes,
  middleware,
  CALL_FIRESTORE,
};
