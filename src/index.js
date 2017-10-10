import enhancer from './enhancer';
import reducer from './reducer';
import constants, { actionTypes } from './constants';
import middleware, { CALL_FIRESTORE } from './middleware';

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
