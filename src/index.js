import enhancer, { getFirestore } from './enhancer';
import reducer from './reducer';
import { firestoreActions } from './actions';
import createFirestoreInstance from './createFirestoreInstance';
import constants, { actionTypes } from './constants';
import middleware, { CALL_FIRESTORE } from './middleware';
import { getSnapshotByObject } from './utils/query';

// converted with transform-inline-environment-variables
export const version = process.env.npm_package_version;

export {
  reducer,
  reducer as firestoreReducer,
  enhancer,
  enhancer as reduxFirestore,
  createFirestoreInstance,
  firestoreActions as actions,
  getFirestore,
  getSnapshotByObject,
  constants,
  actionTypes,
  middleware,
  CALL_FIRESTORE,
};

export default {
  version,
  reducer,
  firestoreReducer: reducer,
  enhancer,
  reduxFirestore: enhancer,
  createFirestoreInstance,
  actions: firestoreActions,
  getFirestore,
  getSnapshotByObject,
  constants,
  actionTypes,
  middleware,
  CALL_FIRESTORE,
};
