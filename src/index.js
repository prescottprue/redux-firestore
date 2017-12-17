import enhancer, { getFirestore } from './enhancer';
import reducer from './reducer';
import { firestoreActions } from './actions';
import createFirestoreInstance from './createFirestoreInstance';
import constants, { actionTypes } from './constants';
import middleware, { CALL_FIRESTORE } from './middleware';

export default {
  version: process.env.npm_package_version, // converted with transform-inline-environment-variables
  firestoreReducer: reducer,
  reduxFirestore: enhancer,
  createFirestoreInstance,
  actions: firestoreActions,
  reducer,
  enhancer,
  getFirestore,
  constants,
  actionTypes,
  middleware,
  CALL_FIRESTORE,
};
